# SedERP Mobile (Expo / React Native)

Android + iOS app with the same functionality as the SedERP web app, talking to
the **same backend** (`https://sed-erp.onrender.com`). Real-time telemetry over
Socket.IO, JWT auth + RBAC, SedIoT monitoring/control, SedService marketplace.

## Run in Expo Go (fastest, free, both platforms)

```bash
cd mobile
npm install
npx expo install --fix     # aligns native package versions to the Expo SDK
npx expo start             # scan the QR code with the Expo Go app on your phone
```

- Install **Expo Go** from the Play Store / App Store, then scan the QR.
- The app defaults to the live prod backend, so login works immediately with the
  demo accounts (admin@sederp.com / Admin@123, etc.).
- To point at a local backend, copy `.env.example` → `.env` and set
  `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` to your machine's LAN IP.

## Build a real Android APK (free, via EAS)

```bash
npm install -g eas-cli
eas login                  # your free Expo account
eas build -p android --profile preview   # produces an installable .apk
```

> A standalone iOS build / App Store submission requires a paid Apple Developer
> account ($99/yr). For iOS testing, Expo Go is free.

## Stack

Expo Router · React Native · TypeScript · Zustand (persisted via AsyncStorage) ·
axios · socket.io-client · lucide-react-native · react-i18next.

## Structure

```
mobile/
├─ app/            expo-router screens
│  ├─ _layout.tsx  root (hydration gate + Stack)
│  ├─ login.tsx
│  └─ (tabs)/      Home · SedIoT · SedService (auth-gated)
└─ src/
   ├─ components/  Card, Button, TopBar
   ├─ store/       authStore (persisted)
   ├─ lib/         api (axios + JWT)
   ├─ socket/      shared Socket.IO client
   ├─ config.ts    API/socket URLs
   └─ theme.ts     dark design tokens
```
