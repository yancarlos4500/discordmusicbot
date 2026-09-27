const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getOrCreateQueue } = require('../utils/queue');
const { resolveSong } = require('../utils/resolveSong');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube, or add it to the queue')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('YouTube URL or search terms')
        .setRequired(true)
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: 'Join a voice channel first.', ephemeral: true });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
      return interaction.reply({ content: "I need permission to join and speak in that voice channel.", ephemeral: true });
    }

    await interaction.deferReply();

    const query = interaction.options.getString('query', true);
    let song;
    try {
      song = await resolveSong(query, interaction.user);
    } catch (error) {
      console.error('Failed to resolve song:', error);
      return interaction.editReply('Could not find or load that song.');
    }

    if (!song) {
      return interaction.editReply('No results found for that query.');
    }

    const queue = getOrCreateQueue(interaction.guild.id);
    queue.textChannel = interaction.channel;

    if (!queue.connection) {
      try {
        await queue.connect(voiceChannel);
      } catch (error) {
        console.error('Failed to join voice channel:', error);
        return interaction.editReply('Could not join the voice channel.');
      }
    }

    const wasEmpty = queue.songs.length === 0;
    queue.enqueue(song);

    return interaction.editReply(
      wasEmpty ? `▶️ Now playing: **${song.title}**` : `➕ Added to queue: **${song.title}**`
    );
  },
};
