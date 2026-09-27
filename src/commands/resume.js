const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getQueue } = require('../utils/queue');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused song'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: 'There is nothing to resume.', flags: MessageFlags.Ephemeral });
    }

    queue.resume();
    return interaction.reply('▶️ Resumed.');
  },
};
