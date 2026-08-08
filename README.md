# QuizNova

Educational puzzle and trivia app for general audiences — 100 free questions across Math, Science, History, and Computer Science.

> **Not ready for store submission yet.** See [Pre-publish checklist](#pre-publish-checklist) below.

## Features

- 100 puzzles in 4 categories with Easy / Medium / Hard progression
- Session modes: Quick (5), Standard (10), Challenge (20), Full, Endless, Daily Challenge
- Results screen with accuracy, streak, time, retry incorrect, share score
- Hints, explanations, report-question button
- Settings: sound, vibration, large text, reduce animations, export/import progress
- In-app Privacy Policy, Terms, About, Contact
- Offline-capable mobile build via Capacitor
- No ads, no account required

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Android (Capacitor)

```bash
npm run cap:sync          # build web + sync to android/
npm run cap:android       # open Android Studio
```

Package ID: `com.uzbek2003.quiznova`

## Deploy web version

Deploy the `dist/` folder to Vercel, Netlify, or GitHub Pages. Public legal URLs:

- `/privacy`
- `/terms`
- `/about`
- `/support`

```bash
npm run deploy:vercel
```

Privacy policy URL (after deploy): `https://your-domain.com/privacy`

## Pre-publish checklist

| Item | Status |
|------|--------|
| App rebrand to QuizNova | Done |
| Remove age 7–35 marketing | Done |
| Privacy policy (in-app + web) | Done |
| Terms, About, Contact | Done |
| Session modes + results screen | Done |
| Settings screen | Done |
| Answer feedback improvements | Done |
| Export/import progress | Done |
| Report incorrect question | Done |
| Android back button | Done |
| Haptics + sound toggles | Done |
| Manual review of all 100 questions | **You must do this** |
| Custom app icon + splash (store quality) | Partial — basic icon only |
| Play Store / App Store screenshots | **Not done** |
| Real-device Android QA | **You must test** |
| Support email configured | Done — shakhzodrafikov915@gmail.com |

## Support

Email: shakhzodrafikov915@gmail.com

## License

Private — all rights reserved.
