const fs = require('node:fs');
const path = require('node:path');

const COOKIES_FILE = path.join(__dirname, '..', '..', 'data', 'cookies.json');

let cached;

/** Returns the current cookie array, preferring a saved file over the YT_COOKIES env var. */
function loadCookies() {
  if (cached !== undefined) return cached;
  try {
    cached = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
  } catch {
    try {
      cached = process.env.YT_COOKIES ? JSON.parse(process.env.YT_COOKIES) : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function saveCookies(cookies) {
  fs.mkdirSync(path.dirname(COOKIES_FILE), { recursive: true });
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies));
  cached = cookies;
}

module.exports = { loadCookies, saveCookies };
