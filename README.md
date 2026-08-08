# MindForge

Educational puzzle and trivia app for general audiences — 100 free questions across Math, Science, History, and Computer Science.

> **Not ready for store submission yet.** See [Pre-publish checklist](#pre-publish-checklist) below.

## Features

- 100 puzzles in 4 categories with Easy / Medium / Hard progression
- Session modes: Quick (5), Standard (10), Challenge (20), Full, Endless, Daily Challenge
- Number Kingdom story adventure prototype with XP and boss battles
- Results screen with accuracy, streak, time, retry incorrect, Review Mistakes, share score
- Hints, explanations, report-question button
- Settings: sound, vibration, large text, reduce animations, voice personas, export/import progress
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

Package ID: `com.shakhzodrafikov.mindforge`

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
| App rebrand to MindForge | Done |
| Android application ID `com.shakhzodrafikov.mindforge` | Done |
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
| Manual review of all 100 questions | Done |
| Real-device Android QA (Samsung) | Done |
| Support email configured | Done — shakhzodrafikov915@gmail.com |
| Custom app icon + splash (store quality) | Done — Knowledge Cube icons/splash installed (physical Android QA pending) |
| Play Store feature graphic + 512 icon | Done — see `public/feature-graphic-1024x500.png` and `public/play-icon-512.png` |
| Play Store / App Store screenshots | **Not done** |
| Release signing keystore | **Not done** |

## Support

Email: shakhzodrafikov915@gmail.com

## License

Private — all rights reserved.
