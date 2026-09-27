const ytdl = require('@distube/ytdl-core');
const ytsr = require('@distube/ytsr');
const { getAgent } = require('./ytdlAgent');

/**
 * Resolves a user query (URL or search terms) to a playable song object.
 * @param {string} query
 * @param {import('discord.js').User} requestedBy
 */
async function resolveSong(query, requestedBy) {
  if (ytdl.validateURL(query)) {
    const agent = getAgent();
    const info = await ytdl.getBasicInfo(query, agent ? { agent } : undefined);
    return {
      title: info.videoDetails.title,
      url: info.videoDetails.video_url,
      requestedBy: requestedBy.tag,
    };
  }

  const { items } = await ytsr(query, { limit: 10 });
  const video = items.find((item) => item.type === 'video');
  if (!video) return null;

  return {
    title: video.name,
    url: video.url,
    requestedBy: requestedBy.tag,
  };
}

module.exports = { resolveSong };
