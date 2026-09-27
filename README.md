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

## Bot joins the voice channel but won't play / "Could not join the voice channel"

If the bot visually shows as connected to the voice channel but `/play` still replies "Could not join the voice channel", or playback never starts, check the logs (Railway → your service → **Deployments → View Logs**) for lines like:

```
[voice <guildId>] signalling -> connecting
[voice <guildId>] connecting -> ready
```

If it gets stuck at `connecting` and never reaches `ready`, that's the actual audio (UDP/RTP) handshake failing — this is **not the same connection as the visible "joined channel" state**, which only requires the WebSocket gateway and succeeds much earlier. A stuck `connecting` state almost always means outbound UDP traffic is being blocked or restricted by the host's network, not a bug in this bot.

To fix it:
- Confirm it works when running the bot **locally** first (`npm start` on your own machine) — if it works locally but not on Railway, it's the hosting network, not the code.
- On Railway, check the service isn't on a networking mode that restricts UDP, and try redeploying to a different region.
- If it still fails, Railway (and several other container PaaS platforms) can have inconsistent UDP support for Discord voice specifically. Hosting on a small VPS (e.g. a $5–6/mo DigitalOcean/Vultr/Oracle Cloud instance) is the most reliable fix for voice bots if this persists.

## Commands

- `/play query:<url or search terms>` – play a song or add it to the queue
- `/pause` – pause the current song
- `/resume` – resume playback
- `/skip` – skip the current song
- `/queue` – show the current queue
- `/stop` – stop playback, clear the queue, and leave the voice channel
- `/leave` – disconnect from the voice channel

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
