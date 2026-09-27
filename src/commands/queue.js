const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getQueue } = require('../utils/queue');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current song queue'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: 'The queue is empty.', flags: MessageFlags.Ephemeral });
    }

    const list = queue.songs
      .map((song, index) => `${index === 0 ? '▶️' : `${index}.`} **${song.title}** — requested by ${song.requestedBy}`)
      .join('\n');

    const embed = new EmbedBuilder().setTitle('Music Queue').setDescription(list).setColor(0x5865f2);

    return interaction.reply({ embeds: [embed] });
  },
};
