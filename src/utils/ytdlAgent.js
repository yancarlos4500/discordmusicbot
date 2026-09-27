const ytdl = require('@distube/ytdl-core');
const { loadCookies } = require('./cookieStore');

// rebuilt only when the underlying cookie array reference changes (e.g. via /setcookies)
let agentCache;
let cookiesUsedForCache;

/** Returns a ytdl agent authenticated with the current cookies, or undefined if none are set. */
function getAgent() {
  const cookies = loadCookies();
  if (!cookies) return undefined;
  if (cookies !== cookiesUsedForCache) {
    agentCache = ytdl.createAgent(cookies);
    cookiesUsedForCache = cookies;
  }
  return agentCache;
}

module.exports = { getAgent };
