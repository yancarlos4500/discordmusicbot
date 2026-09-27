const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { saveCookies } = require('../utils/cookieStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcookies')
    .setDescription('(Owner only) Upload YouTube cookies to fix "Sign in to confirm you\'re not a bot" errors')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption((option) =>
      option.setName('file').setDescription('Cookies for youtube.com exported as a JSON file').setRequired(true)
    ),

  async execute(interaction) {
    // cookies are shared across every server the bot is in, so this is restricted bot-wide, not per-guild
    if (!process.env.OWNER_ID || interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: 'Only the bot owner can use this command.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const file = interaction.options.getAttachment('file', true);
    if (!file.name?.toLowerCase().endsWith('.json')) {
      return interaction.editReply('Please upload a `.json` file (exported YouTube cookies).');
    }

    try {
      const response = await fetch(file.url);
      const cookies = await response.json();
      if (!Array.isArray(cookies) || cookies.length === 0) {
        throw new Error('File must contain a non-empty JSON array of cookies.');
      }

      saveCookies(cookies);
      return interaction.editReply(`Saved ${cookies.length} cookies. Playback will use them immediately.`);
    } catch (error) {
      // never log the file contents themselves - they're session credentials
      console.error('Failed to save cookies:', error.message);
      return interaction.editReply('Could not read that file — make sure it is valid cookie JSON.');
    }
  },
};
