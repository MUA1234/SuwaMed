# SuwaMed — Telehealth Platform

**Author:** Nawarathne Adikaram (Plymouth Index 10953507)
**Module:** PUSL3190 — Computing Project, BSc (Hons) Computer Science, University of Plymouth
**Supervisor:** Mr. Anton Jayakody

SuwaMed is a trilingual (English / Sinhala / Tamil) telehealth mobile application built for the Sri Lankan healthcare ecosystem. It connects patients with SLMC-verified doctors for video and chat consultations, supports digital prescriptions, AI-assisted symptom triage, health records, payments, and an administrator workflow for doctor verification.

---

## How to evaluate this project

You have two options for marking the project, in descending order of convenience:

### Option 1 — Install the pre-built APK (recommended, fastest)

A pre-built Android APK is provided in the OneDrive submission folder:

> **APK location:** https://liveplymouthac-my.sharepoint.com/:f:/g/personal/10953507_students_plymouth_ac_uk/IgDuKzUmXsqBSpJHtDbNVp2qAd_NYveH_TTeLbFzoy-46kk?e=gzwx5H

1. Download `SuwaMed.apk` to an Android phone (Android 8.0+).
2. Open the file. Android will warn about installing from an unknown source — accept.
3. Launch SuwaMed. Skip to **Test accounts** below.

The backend is already deployed and the APK is pre-configured to point at it. **No local setup is needed.**

### Option 2 — Run the source via Expo Go

Use this if you want to inspect the code while it runs, or if you don't have an Android device available.

**Requirements**
- Node.js 20+ and npm
- A smartphone (iOS or Android) with the **Expo Go** app installed from the App Store / Play Store
- The phone and the computer must be on the same Wi-Fi network

**Steps**

```bash
git clone <repository-url> SuwaMed
cd SuwaMed/suwamed-mobile
npm install
npx expo start
```

A QR code is printed in the terminal.

- **iOS:** open the iPhone's built-in **Camera** app, point it at the QR code, then tap the banner that appears. The app opens inside Expo Go. (Apple does not allow Expo Go's own scanner on iOS.)
- **Android:** open Expo Go on the phone, tap "Scan QR code", point it at the terminal.

The first bundle takes 30–90 seconds. Subsequent reloads are near-instant.

**You do not need to run the backend locally.** The backend is hosted on Vercel at `https://suwamed-backend.vercel.app` and the mobile app is pre-wired to call it. The repository ships a `suwamed-backend/` directory only for source code review purposes.

> *Caveat:* Apple disabled remote push delivery to Expo Go on iOS in SDK 53+, so push notifications won't arrive in this mode. They work fully in the pre-built APK from Option 1. The video-call screen also requires a development build (it depends on a native module); in Expo Go it displays an explanatory placeholder rather than crashing. Every other feature works.

---

## Test accounts

The deployed backend is seeded with one account per role. Use these to log in:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@suwamed.lk` | `Admin@123` |
| Doctor (verified) | `chamara@suwamed.lk` | `Doctor@123` |
| Patient | `kumari@suwamed.lk` | `Patient@123` |

Sign in from the **Login** screen after selecting the role on the **Role Selection** screen.

---

## What the application does

### Patients
- Search SLMC-verified doctors by specialisation and district.
- Book video, chat, or follow-up appointments.
- AI symptom triage in English / Sinhala / Tamil (OpenAI `gpt-4o-mini` with a deterministic rule-based fallback).
- Upload health records (photo, scan) which are compressed client-side and stored on Cloudinary.
- View and manage digital prescriptions issued by their doctor.
- Manage medication reminders that schedule on-device repeating notifications.
- Cash-on-consultation payment flow with downloadable history.
- View locally-cached pharmacies map with Google Maps deep-links.
- Submit and track support tickets.

### Doctors
- SLMC pre-registration verification (the registration form checks the entered SLMC number against a seeded SLMC registry before allowing onboarding).
- Manage weekly availability and ad-hoc blocked time-off.
- Accept / cancel appointment requests; both sides receive push notifications.
- Real-time chat with patients via Socket.io; one-to-one video consultations via Agora.
- Write digital prescriptions linked to the consultation.
- Earnings dashboard with withdrawal requests (LKR 500 minimum).
- Upload verification documents (SLMC certificate, NIC, medical degree) which gate the rest of the role behind admin approval.

### Administrators
- Verify / reject pending doctor accounts; both decisions push a notification to the doctor.
- Suspend / reactivate any user; every admin action is recorded in a system-log audit trail.
- Platform analytics: monthly revenue, appointment volumes, user counts.
- Publish health-tip articles in any of the three languages.
- Read and reply to user-submitted support tickets.

---

## Architecture

```
┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│  React Native + Expo 54  (mobile)   │◀───────▶│  Express 5 + TypeScript  (backend)  │
│  - Zustand stores                   │  HTTPS  │  - JWT auth (15m access, 7d refresh)│
│  - React Navigation                 │         │  - Joi validation                   │
│  - react-i18next (en/si/ta)         │         │  - express-rate-limit + helmet      │
│  - Socket.io client                 │  WSS    │  - Socket.io server                 │
│  - expo-notifications               │         │  - node-cron reminder jobs          │
│  - Agora SDK (dev build only)       │         │                                     │
└─────────────────────────────────────┘         └──────────────┬──────────────────────┘
                                                               │
                            ┌──────────────────────────────────┼─────────────────────────────┐
                            ▼                                  ▼                             ▼
                    ┌───────────────┐                   ┌───────────────┐             ┌───────────────┐
                    │ MongoDB Atlas │                   │  Cloudinary   │             │  Firebase     │
                    │  (Mongoose)   │                   │  (uploads)    │             │  Admin (FCM)  │
                    └───────────────┘                   └───────────────┘             └───────────────┘
```

### Backend (`suwamed-backend/`)
- Node.js + TypeScript on Express 5.
- MongoDB (Mongoose) for primary persistence; 16 collections.
- JWT access + refresh tokens; bcrypt-hashed passwords, OTPs, and refresh tokens at rest.
- Socket.io for real-time chat with appointment-scoped rooms and JWT handshake auth.
- Firebase Admin SDK for FCM push delivery (with Expo Push fallback for development tokens).
- Cloudinary for image storage; Multer memory storage with image/PDF type filtering and a 5 MB cap.
- Agora server-side RTC token minting for 1:1 video consultations.
- OpenAI `gpt-4o-mini` for symptom triage with a rule-based fallback when the API key is absent or the call fails.
- `node-cron` for 24-hour and 1-hour appointment reminders.
- Audit logging of administrator actions to a `SystemLog` collection.
- Swagger UI at `/api/docs`.

### Mobile (`suwamed-mobile/`)
- React Native with Expo SDK 54 and the new architecture.
- 65+ screens across patient / doctor / admin role navigators, with verification-status gating for doctors.
- Zustand stores with AsyncStorage persistence for auth and settings.
- React Hook Form + Zod validation; React Native Paper MD3 theming with light/dark.
- Full trilingual UI; every screen reads through `useTranslation`.
- Client-side image compression (`expo-image-manipulator`) before every upload — typical phone photos drop from 8–12 MB to 200–500 KB.

---

## Source code layout

```
SuwaMed/
├── README.md                       ← this file
├── 10953507_Abstract.pdf           ← submitted abstract
├── 10953507_PID.pdf                ← submitted Project Initialisation Document
├── Logo.png
├── suwamed-backend/                ← Express + MongoDB API (deployed on Vercel)
│   ├── server.ts
│   ├── src/
│   │   ├── controllers/            ← route handlers
│   │   ├── routes/
│   │   ├── models/                 ← Mongoose schemas (16 collections)
│   │   ├── services/               ← OpenAI, Agora, notifications, reminders, system log, email
│   │   ├── middleware/             ← auth, rate limiting, validation, sanitisation, error
│   │   ├── socket/                 ← Socket.io chat handlers
│   │   ├── config/                 ← DB, Firebase, Swagger, Cloudinary
│   │   ├── utils/
│   │   └── validators/             ← Joi schemas
│   ├── tests/                      ← Jest + Supertest smoke tests
│   ├── scripts/                    ← SLMC seed
│   └── .env.example
└── suwamed-mobile/                 ← Expo React Native app
    ├── App.tsx
    ├── app.json
    ├── eas.json
    └── src/
        ├── screens/
        │   ├── auth/
        │   ├── patient/            ← 27 screens
        │   ├── doctor/             ← 18 screens
        │   ├── admin/              ← 17 screens
        │   └── shared/             ← ChatScreen, VideoCallScreen, Privacy, Terms
        ├── navigation/             ← role-aware navigators
        ├── components/             ← reusable UI primitives
        ├── store/                  ← Zustand stores
        ├── api/                    ← typed axios clients
        ├── services/               ← push notifications
        ├── hooks/
        ├── locales/                ← en.json, si.json, ta.json (776 keys each)
        ├── contexts/               ← ThemeContext
        ├── config/                 ← API base, theme, i18n
        └── utils/                  ← image compression, validators
```

---

## Backend deployment

The backend is hosted on **Vercel** at `https://suwamed-backend.vercel.app`. The mobile app is configured to call it via `EXPO_PUBLIC_API_BASE` in `eas.json`.

You do **not** need to run the backend to evaluate the project. It is included in the repository for source-code review only.

If you do want to run the backend locally for inspection:

```bash
cd suwamed-backend
cp .env.example .env       # fill in MongoDB Atlas URI, JWT secrets, Cloudinary, etc.
npm install
npm run dev                # nodemon + ts-node, port 5000
```

API documentation is available at `https://suwamed-backend.vercel.app/api/docs` (Swagger UI).

---

## Languages

The application is fully translated into English, Sinhala (සිංහල), and Tamil (தமிழ்). The active language is changed from **Profile → Language** in any role. All 776 i18n keys per locale cover authentication, validation messages, error states, onboarding consent, privacy and terms screens, and every UI label.

---

## Declaration of AI tooling

In line with University of Plymouth Academic Integrity policy on the use of generative AI in coursework, I declare that this project made use of Anthropic Claude as a coding assistant for boilerplate generation, debugging support, documentation drafting, and code review. All system architecture, design decisions, feature scoping, integration logic, and final acceptance of every line of code were authored, reviewed, and validated by the student. AI suggestions were treated as proposals to be evaluated rather than authoritative output.

---

## Submission checklist

- [x] Source code (this repository)
- [x] Pre-built Android APK on OneDrive
- [x] Test credentials for all three roles (above)
- [x] Submitted Abstract (`10953507_Abstract.pdf`)
- [x] Submitted PID (`10953507_PID.pdf`)
