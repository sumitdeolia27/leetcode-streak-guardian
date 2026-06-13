# LeetCode Streak Guardian

Free Telegram reminders when you miss your daily LeetCode problem.

## Quick Start

```bash
npm install
copy .env.example .env.local
npm.cmd run dev
```

Open http://localhost:3000.

## Setup

### 1. MongoDB Atlas
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Add the connection string to `.env.local` as `MONGODB_URI`

### 2. Telegram Bot
- Open Telegram and message `@BotFather`
- Create a bot with `/newbot`
- Copy the bot token into `.env.local` as `TELEGRAM_BOT_TOKEN`
- Send any message to your new bot
- Get your chat ID from:

```text
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

Use that chat ID when registering in the app.

### 3. Firebase Google Login
- Enable Google provider in Firebase Authentication
- Add `localhost` to Firebase authorized domains for local testing
- Add your Firebase web API key to `.env.local` as `FIREBASE_WEB_API_KEY`

### 4. Telegram Webhook
To make the bot reply with a user's chat ID on `/start`, set the webhook after deployment:

```text
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_DOMAIN/api/telegram/webhook
```

### 5. Cron
- Vercel uses `vercel.json` to call `/api/check-streak` every minute
- Local/Railway/Render can use `USE_NODE_CRON=true`
- After the user's alert time, reminders repeat every minute until LeetCode is completed

## Tech Stack
Next.js 14 | MongoDB | Telegram Bot API | Tailwind CSS | TypeScript
