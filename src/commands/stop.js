const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getQueue, deleteQueue } = require('../utils/queue');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop playback, clear the queue, and leave the voice channel'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ content: "I'm not playing anything.", flags: MessageFlags.Ephemeral });
    }

    queue.stop();
    deleteQueue(interaction.guild.id);
    return interaction.reply('⏹️ Stopped and cleared the queue.');
  },
};
