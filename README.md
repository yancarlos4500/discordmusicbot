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
