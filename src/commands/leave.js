const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getQueue, deleteQueue } = require('../utils/queue');

module.exports = {
  data: new SlashCommandBuilder().setName('leave').setDescription('Disconnect the bot from the voice channel'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || !queue.connection) {
      return interaction.reply({ content: "I'm not in a voice channel.", flags: MessageFlags.Ephemeral });
    }

    queue.stop();
    deleteQueue(interaction.guild.id);
    return interaction.reply('👋 Left the voice channel.');
  },
};
