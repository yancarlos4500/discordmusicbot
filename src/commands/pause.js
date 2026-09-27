const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../utils/queue');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || !queue.playing) {
      return interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
    }

    queue.pause();
    return interaction.reply('⏸️ Paused.');
  },
};
