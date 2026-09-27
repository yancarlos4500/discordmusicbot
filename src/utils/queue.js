const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const { getAgent } = require('./ytdlAgent');

/** Holds playback state (connection, player, song list) for a single guild. */
class GuildQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.textChannel = null;
    this.voiceChannel = null;
    this.connection = null;
    this.player = createAudioPlayer();
    this.songs = [];
    this.playing = false;

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.songs.shift();
      this.playing = false;
      this.playNext();
    });

    this.player.on('error', (error) => {
      console.error(`Playback error in guild ${this.guildId} playing "${this.songs[0]?.url}":`, error);
      if (this.textChannel && this.songs[0]) {
        this.textChannel.send(`⚠️ Skipping **${this.songs[0].title}** — playback failed.`).catch(() => {});
      }
      this.songs.shift();
      this.playing = false;
      this.playNext();
    });
  }

  async connect(voiceChannel) {
    this.voiceChannel = voiceChannel;
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      // required for the connection to emit 'debug' events at all
      debug: true,
    });
    this.connection.on('stateChange', (oldState, newState) => {
      console.log(`[voice ${this.guildId}] ${oldState.status} -> ${newState.status}`);
      // the library only surfaces internal state codes, not the actual WS close code/reason - grab it directly
      if (newState.networking && newState.networking !== oldState.networking) {
        const ws = newState.networking.state.ws;
        ws?.on('close', (event) => {
          console.log(`[voice ${this.guildId}] raw voice ws close: code=${event?.code} reason=${event?.reason || '(none)'}`);
        });
      }
    });
    // low-level handshake internals: DNS, UDP IP discovery, encryption negotiation
    this.connection.on('debug', (message) => console.log(`[voice ${this.guildId}] debug: ${message}`));
    this.connection.on('error', (error) => console.error(`[voice ${this.guildId}] error:`, error));
    this.connection.subscribe(this.player);
    try {
      // generous timeout: the voice websocket can drop and auto-rejoin mid-handshake, which takes longer than the default 20s
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
      this.connection.destroy();
      this.connection = null;
      throw error;
    }
  }

  enqueue(song) {
    this.songs.push(song);
    this.playNext();
  }

  playNext() {
    if (this.playing || this.songs.length === 0) return;
    const song = this.songs[0];
    this.playing = true;

    const agent = getAgent();
    const stream = ytdl(song.url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
      ...(agent ? { agent } : {}),
    });
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    this.player.play(resource);

    if (this.textChannel) {
      this.textChannel.send(`▶️ Now playing: **${song.title}**`).catch(() => {});
    }
  }

  pause() {
    return this.player.pause();
  }

  resume() {
    return this.player.unpause();
  }

  skip() {
    this.player.stop();
  }

  stop() {
    this.songs = [];
    this.player.stop();
    if (this.connection) {
      this.connection.destroy();
    }
  }
}

/** @type {Map<string, GuildQueue>} */
const queues = new Map();

function getQueue(guildId) {
  return queues.get(guildId);
}

function getOrCreateQueue(guildId) {
  let queue = queues.get(guildId);
  if (!queue) {
    queue = new GuildQueue(guildId);
    queues.set(guildId, queue);
  }
  return queue;
}

function deleteQueue(guildId) {
  queues.delete(guildId);
}

module.exports = { GuildQueue, getQueue, getOrCreateQueue, deleteQueue };
