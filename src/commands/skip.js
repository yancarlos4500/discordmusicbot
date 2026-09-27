const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getQueue } = require('../utils/queue');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),

  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: 'There is nothing to skip.', flags: MessageFlags.Ephemeral });
    }

    const skipped = queue.songs[0];
    queue.skip();
    return interaction.reply(`⏭️ Skipped **${skipped.title}**.`);
  },
};
