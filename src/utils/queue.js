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
      console.error(`Playback error in guild ${this.guildId}:`, error.message);
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
    });
    this.connection.subscribe(this.player);
    await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
  }

  enqueue(song) {
    this.songs.push(song);
    this.playNext();
  }

  playNext() {
    if (this.playing || this.songs.length === 0) return;
    const song = this.songs[0];
    this.playing = true;

    const stream = ytdl(song.url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
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
