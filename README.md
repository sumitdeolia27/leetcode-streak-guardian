# Streak Guardian for LeetCode

Streak Guardian is a full-stack Next.js application that helps users protect
their LeetCode streak. Users can connect a LeetCode username, plan daily DSA
questions, set reminder times, and receive Telegram alerts when planned work is
still pending.

This project is not affiliated with LeetCode.

## Features

- User registration with name, phone number, Gmail ID, password, and LeetCode ID
- Login with LeetCode ID/name, Gmail, password, or Google Firebase Auth
- LeetCode profile card with streak, solved count, and difficulty stats
- 12-hour AM/PM reminder time picker
- Telegram Chat ID connection and test reminders
- Alert frequency modes: every 1 minute, 5 minutes, 15 minutes, or urgent mode
- Daily DSA planner with manual question entry
- Question bank with topic and preset lists
- CSV, text, and public Google Sheet question import
- Weekly plan generator
- Progress calendar showing planned, completed, pending, and missed questions
- Analytics for total solved, planned questions, weak topics, and missed days
- Auto-detect solved planned questions from recent accepted LeetCode submissions
- Telegram bot commands: `/start`, `/today`, `/plan`, `/done 1`, `/pause`

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- Telegram Bot API
- Firebase Authentication
- Vercel Cron or Node Cron

## Project Structure

```text
app/
  api/                  API routes for auth, users, Telegram, LeetCode, plans
  dashboard/            Authenticated dashboard and planner
  signup/               Registration page
components/             Reusable UI components
lib/                    MongoDB, auth, Telegram, LeetCode, cron helpers
models/                 Mongoose models
vercel.json             Vercel cron configuration
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/leetcode-streak-guardian.git
cd leetcode-streak-guardian
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the local environment file

```bash
copy .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

### 4. Fill environment variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leetcode-guardian
TELEGRAM_BOT_TOKEN=123456789:your-telegram-bot-token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourTelegramBotUsername
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
CRON_SECRET=your-random-cron-secret
SESSION_SECRET=your-random-session-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
USE_NODE_CRON=true
```

Never commit `.env.local` or real secrets to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `TELEGRAM_BOT_TOKEN` | Yes | Token from BotFather |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Yes | Telegram bot username without `@` |
| `FIREBASE_WEB_API_KEY` | Yes | Firebase web API key for Google login |
| `CRON_SECRET` | Yes | Secret used to protect `/api/check-streak` |
| `SESSION_SECRET` | Yes | Secret used to sign auth cookies |
| `NEXT_PUBLIC_APP_URL` | Yes | Local or deployed app URL |
| `USE_NODE_CRON` | Yes | `true` for local/Render, `false` for Vercel |

## Telegram Bot Setup

1. Open Telegram and search for `@BotFather`.
2. Create a bot with `/newbot`.
3. Copy the bot token into `TELEGRAM_BOT_TOKEN`.
4. Set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` to your bot username.
5. Start your app and register a user.
6. In the signup form, enter a phone number, open the bot, then fill the chat ID.

After deployment, set the webhook:

```text
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_DOMAIN/api/telegram/webhook
```

Telegram commands supported by the bot:

```text
/start
/today
/plan
/done 1
/pause
```

## Firebase Google Login Setup

1. Create a Firebase project.
2. Go to Authentication.
3. Enable Google provider.
4. Add authorized domains:
   - `localhost`
   - your Vercel or Render domain
5. Copy the Firebase Web API key into `FIREBASE_WEB_API_KEY`.

## MongoDB Setup

1. Create a free MongoDB Atlas cluster.
2. Create a database user.
3. Add your IP address in Network Access.
4. For deployment testing, allow `0.0.0.0/0`.
5. Copy the connection string into `MONGODB_URI`.

## Running Checks

```bash
npm run lint
npm run build
```

## Deployment

### Deploy on Vercel

Vercel is the easiest option for the Next.js app and API routes.

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Framework preset: Next.js.
4. Root directory: repository root.
5. Add the environment variables from `.env.example`.
6. Set:

```env
USE_NODE_CRON=false
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

The included `vercel.json` runs `/api/check-streak` every minute:

```json
{
  "crons": [
    {
      "path": "/api/check-streak",
      "schedule": "* * * * *"
    }
  ]
}
```

Vercel cron is good for minute-based checks. It is not suitable for true
10-second urgent reminders.

### Deploy on Render

Render is better if you want the Node cron process to keep checking in the
background.

Create a Render Web Service with:

```text
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start -- -p $PORT
```

Set:

```env
USE_NODE_CRON=true
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

Free Render services can sleep when inactive, so reliable reminders need an
always-on instance.

## Manual Cron Test

For a local or deployed manual check, call:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/check-streak
```

On Windows PowerShell:

```powershell
Invoke-WebRequest `
  -Headers @{ Authorization = "Bearer YOUR_CRON_SECRET" } `
  http://localhost:3000/api/check-streak
```

## CSV and Google Sheet Import

The planner accepts:

- Plain text with one question per line
- CSV files
- Public Google Sheet links

Recommended CSV columns:

```text
title,url,topic
Two Sum,https://leetcode.com/problems/two-sum/,Arrays
Valid Parentheses,https://leetcode.com/problems/valid-parentheses/,Stack
```

## Troubleshooting

### Telegram message is not coming

- Confirm `TELEGRAM_BOT_TOKEN` is correct.
- Confirm the user has a saved Telegram Chat ID.
- Send `/start` to the bot once.
- If deployed, set the Telegram webhook to `/api/telegram/webhook`.

### Chat ID does not fill automatically

- Enter a valid phone number first.
- Open the bot from the signup form.
- Tap Start in Telegram.
- Return to the app and click Fill Chat ID.

### MongoDB connection fails

- Check `MONGODB_URI`.
- Confirm the database user password is correct.
- Add the deployment provider IP access in MongoDB Atlas.
- For testing, allow `0.0.0.0/0`.

### LeetCode data does not load

- Confirm the LeetCode username is correct.
- Make sure the profile is public.
- Try again after a few minutes if LeetCode rate limits requests.

## Security Notes

- Do not commit `.env.local`.
- Rotate any token or database password that was shared publicly.
- Keep `CRON_SECRET` and `SESSION_SECRET` long and random.
- Use dummy data in screenshots and README examples.

## Scripts

```bash
npm run dev      # Start local development server
npm run build    # Build production app
npm run start    # Start production server
npm run lint     # Run Next.js lint checks
```

## License

This project is for learning and portfolio use. Add a license file before using
it in a public or commercial project.
