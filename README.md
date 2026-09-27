# djadoni – Discord Music Bot

A Discord bot that plays audio from YouTube with a queue, play/pause/skip/stop controls.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a Discord application + bot at https://discord.com/developers/applications, enable the **Server Members** and **Voice** related intents are not required, but make sure the bot has `Connect` and `Speak` permissions in your server.
3. Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN` – your bot token
   - `CLIENT_ID` – your application's client ID
   - `GUILD_ID` – (optional) a test server ID for instant command deployment
4. Register the slash commands:
   ```
   npm run deploy
   ```
5. Start the bot:
   ```
   npm start
   ```

## Inviting the bot to your server

Discord only adds the bot as a member when the invite link includes **both** the `bot` and `applications.commands` scopes. If you authorize with just `applications.commands` (or the wrong client ID), the authorize page succeeds but no bot ever joins.

Use this URL, replacing `YOUR_CLIENT_ID` with your application's **Application ID** (Developer Portal → General Information — not the bot token):

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3165184&scope=bot+applications.commands
```

`permissions=3165184` grants View Channels, Send Messages, Embed Links, Connect, and Speak — the minimum needed for this bot.

If it still doesn't join:
- Make sure you're logged into the Discord account that has **Manage Server** permission on the target server, and select that server in the authorize dropdown.
- Check the Developer Portal → **Bot** tab — the bot must exist there (client ID and bot are on the same application).
- Try the link in an incognito window/different browser if the authorize page loads but nothing happens after clicking Authorize.
- If the bot appears in the member list but shows offline, that's a separate issue (the bot process itself isn't running/logged in) — that's not this problem.

## Slash commands not showing up

- **Did you run `npm run deploy`?** Joining the server does not register commands — you must run the deploy script (locally or via Railway) at least once, and again whenever commands change.
- **No `GUILD_ID` set?** Without it, `npm run deploy` registers commands **globally**, which can take up to an hour to appear on Discord clients. For instant testing, set `GUILD_ID` in `.env` to your test server's ID (enable Developer Mode in Discord → right-click the server icon → Copy Server ID) and re-run `npm run deploy`.
- **Restart your Discord client** (`Ctrl+R`/`Cmd+R`, or fully quit and reopen) — the command list is cached locally.
- Check the deploy script's console output for errors — a 401 means a bad `DISCORD_TOKEN`, a 403 usually means the bot wasn't invited with the `applications.commands` scope.
- Confirm the `CLIENT_ID` used for `npm run deploy` matches the bot you invited (same application).

## Bot joins the voice channel but audio never plays

Requires **Node.js ≥22.12.0** and `@discordjs/voice` ≥0.19 — older versions don't support Discord's mandatory DAVE (end-to-end encryption) voice protocol and will fail to connect with close code `4017`. If playback still fails, check the logs for `[voice <guildId>] ...` lines (enabled via the `debug: true` option passed to `joinVoiceChannel` in [queue.js](src/utils/queue.js)) to see exactly where the handshake stops.

## Playback fails with "Sign in to confirm you're not a bot"

This is YouTube's own anti-bot challenge, not a bug in this bot — it commonly triggers for requests coming from datacenter IPs (like Railway's). To work around it, supply your own YouTube cookies:

1. Log into youtube.com in a browser, then use a cookie-export extension (e.g. "Cookie-Editor") to export cookies for `youtube.com` as **JSON**.
2. Set the `YT_COOKIES` env var (locally in `.env`, and in Railway's Variables tab) to that JSON array as a single-line string.
3. Restart the bot. [ytdlAgent.js](src/utils/ytdlAgent.js) picks it up automatically and authenticates all YouTube requests with it.

This isn't foolproof since YouTube's detection evolves — if it recurs even with cookies set, refresh the cookies (they expire) or consider switching to a `yt-dlp`-based approach, which is more actively maintained against YouTube's changes.

### Setting cookies via Discord instead of an env var

The `/setcookies` command lets you upload the exported cookies JSON file directly in Discord instead of editing `YT_COOKIES`. It's restricted to a single owner:

1. Set `OWNER_ID` in `.env` (and Railway's Variables) to your own Discord user ID. The command refuses to run for anyone else, and refuses entirely if `OWNER_ID` isn't set.
2. Run `npm run deploy` again so the new command registers.
3. In Discord, run `/setcookies` and attach the exported `cookies.json` file. The reply is ephemeral and the file contents are never logged.
4. Takes effect immediately — no restart needed.

Caveat: cookies set this way are saved to a local `data/cookies.json` file, which persists across restarts but is wiped on Railway when you redeploy (new container filesystem). The `YT_COOKIES` env var survives redeploys; the slash command is just more convenient for quick updates without touching Railway's dashboard.

## Commands

- `/play query:<url or search terms>` – play a song or add it to the queue
- `/pause` – pause the current song
- `/resume` – resume playback
- `/skip` – skip the current song
- `/queue` – show the current queue
- `/stop` – stop playback, clear the queue, and leave the voice channel
- `/leave` – disconnect from the voice channel
- `/setcookies file:<cookies.json>` – (owner only) update the YouTube cookies used for playback

## Deploying to Railway

1. Push this repo to GitHub, then in [Railway](https://railway.app) click **New Project → Deploy from GitHub repo** and select it. Railway auto-detects Node via Nixpacks and uses [railway.json](railway.json) (`npm install` / `npm start`).
2. In the Railway project's **Variables** tab, add:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID` (optional, for instant guild-scoped commands)
3. Register slash commands once, either:
   - Locally: run `npm run deploy` with a local `.env` pointing at the same bot, or
   - On Railway: open the service shell (**Settings → Deploy → Run a command**, or the Railway CLI's `railway run npm run deploy`).
4. Deploy. The bot runs as a background worker (no HTTP port needed), and Railway restarts it automatically on failure (`restartPolicyType: ON_FAILURE` in [railway.json](railway.json)).

# discordmusicbot
