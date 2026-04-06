# SuwaMed - Telemedicine Mobile Application

SuwaMed is a comprehensive telemedicine platform connecting patients, doctors, and administrators through a mobile application. Built for the Sri Lankan healthcare ecosystem, it enables remote consultations, AI-powered symptom checking, health record management, and more.

## What is SuwaMed useful for?

- **Patients** can search for verified doctors, book video or chat consultations, check symptoms using AI, manage health records, receive prescriptions digitally, and access multilingual health tips.
- **Doctors** can manage their schedule and availability, accept appointment requests, conduct video/chat consultations, write digital prescriptions, track earnings, and withdraw funds.
- **Administrators** can verify doctor credentials, manage users, monitor platform revenue, view analytics, and publish health content.

---

## Tech Stack

### Backend
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js + TypeScript | - |
| Framework | Express.js | 5.2.1 |
| Database | MongoDB (Mongoose) | 9.2.3 |
| Authentication | JWT + bcryptjs | 9.0.3 / 3.0.3 |
| File Storage | Cloudinary + Multer | 2.9.0 / 2.1.0 |
| Real-time | Socket.io | 4.8.3 |
| AI | OpenAI | 6.25.0 |
| Payments | PayHere (LKR) | - |
| Push Notifications | Firebase Admin (FCM) | 13.7.0 |
| Task Scheduling | node-cron | 4.2.1 |
| Logging | Winston | 3.19.0 |
| Validation | Joi | 18.0.2 |

### Mobile App
| Layer | Technology | Version |
|---|---|---|
| Framework | React Native (Expo) | 0.81.5 / 54.0.33 |
| Navigation | React Navigation | 7.x |
| State Management | Zustand | 5.0.11 |
| HTTP Client | Axios | 1.13.6 |
| Forms | React Hook Form + Zod | 7.71.2 / 4.3.6 |
| Internationalization | i18next | 25.8.13 |
| UI Components | React Native Paper (MD3) | 5.15.0 |
| Animations | Moti + Reanimated | 0.30.0 / 4.1.1 |
| Real-time | Socket.io Client | 4.8.3 |

---

## Features

### AI-Powered Symptom Checker
- Select body area and symptoms from predefined options
- Receive possible conditions with probability scores and severity assessment
- Get recommendations: self-care, consult a doctor, or emergency
- Suggested doctor specializations based on analysis
- Full support for English, Sinhala, and Tamil

### Video & Chat Consultations
- Agora-powered video calls between patients and doctors
- Real-time chat messaging with text, image, and file support
- Appointment lifecycle management (pending, confirmed, in-progress, completed, cancelled)
- Read receipts and system messages

### Doctor Verification & Management
- Doctors register with SLMC registration number and qualifications
- Admin reviews and verifies/rejects doctor credentials
- Only verified doctors appear in patient search results

### Health Records
- Upload and categorize medical records (lab reports, imaging, vaccinations, discharge summaries)
- Share records with specific doctors during consultations
- Cloud storage via Cloudinary (images and PDFs)

### Digital Prescriptions
- Doctors write prescriptions with medication details (dosage, frequency, duration)
- Patients view prescription history and follow-up instructions
- Linked to specific appointments and diagnoses

### Payments & Earnings
- PayHere integration for consultation fee payments (LKR)
- Subscription tiers: Free, Basic, Premium (with feature limits)
- Doctor earnings tracking with monthly breakdowns
- Bank withdrawal requests for verified doctors

### Push Notifications (FCM)
- Appointment reminders (24h and 1h before)
- Status updates (confirmed, cancelled, started)
- Prescription ready, payment confirmations
- Doctor verification status, health tip publications
- Subscription renewal warnings

### Multilingual Support
- Full UI translations: English, Sinhala, Tamil
- Symptom checker works in all three languages
- Health tips published per language
- User language preference saved in profile

### Location-Based Services
- Nearby pharmacies finder
- District-based doctor search (25 Sri Lankan districts)
- GPS integration via Expo Location

---

## Project Structure

```
SuwaMed/
├── suwamed-backend/
│   ├── src/
│   │   ├── config/          # DB, Firebase, Cloudinary, constants
│   │   ├── controllers/     # Route handlers (15 files)
│   │   ├── middleware/       # Auth, roles, validation, rate limiting, uploads
│   │   ├── models/          # Mongoose schemas (15 models)
│   │   ├── routes/          # API route definitions (15 files)
│   │   ├── services/        # Business logic (auth service)
│   │   ├── utils/           # Logger, tokens, errors
│   │   ├── validators/      # Input validation schemas
│   │   └── types/           # TypeScript type definitions
│   ├── server.ts            # App entry point
│   └── package.json
│
├── suwamed-mobile/
│   ├── src/
│   │   ├── api/             # API client modules (12 files)
│   │   ├── components/      # Reusable UI components
│   │   ├── config/          # Theme, i18n, constants
│   │   ├── hooks/           # Custom hooks (auth, debounce, socket, etc.)
│   │   ├── navigation/      # Role-based navigators (Auth, Patient, Doctor, Admin)
│   │   ├── screens/         # All app screens (~70 screens)
│   │   │   ├── auth/        # Login, register, OTP, password reset
│   │   │   ├── patient/     # Home, appointments, symptoms, records, profile
│   │   │   ├── doctor/      # Dashboard, schedule, patients, earnings, profile
│   │   │   └── admin/       # Dashboard, users, management, reports
│   │   ├── store/           # Zustand state stores
│   │   └── locales/         # Translation files (en, si, ta)
│   ├── assets/              # Icons, images, splash screen
│   └── package.json
│
└── README.md
```

---

## API Routes

| Prefix | Purpose |
|---|---|
| `/api/auth` | Register, login, OTP verification, password reset, token refresh |
| `/api/patients` | Patient profile management |
| `/api/doctors` | Doctor search, profile, dashboard, availability, earnings |
| `/api/appointments` | CRUD, confirm, cancel, start/end consultation |
| `/api/prescriptions` | Create and retrieve prescriptions |
| `/api/health-records` | Upload and manage medical records |
| `/api/symptoms` | AI symptom analysis, history |
| `/api/payments` | Payment history, withdrawal requests |
| `/api/subscriptions` | Subscription plan management |
| `/api/notifications` | Push notifications, FCM token registration |
| `/api/reviews` | Doctor ratings and reviews |
| `/api/health-tips` | Published health content |
| `/api/admin` | Dashboard, user management, doctor verification, revenue |
| `/api/chat` | Real-time messaging |
| `/api/consultations` | Video/chat consultation management |

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Expo Go app installed on your mobile device
- npm or yarn

### Backend Setup

```bash
cd suwamed-backend
npm install
```

Create a `.env` file with the following variables:

```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Authentication
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_PRIVATE_KEY=<private-key>
FIREBASE_CLIENT_EMAIL=<client-email>

# Video Calls
AGORA_APP_ID=<app-id>
AGORA_APP_CERTIFICATE=<certificate>

# Payments
PAYHERE_MERCHANT_ID=<merchant-id>
PAYHERE_MERCHANT_SECRET=<merchant-secret>
PAYHERE_SANDBOX=true

# AI Symptom Checker
OPENAI_API_KEY=<api-key>

# File Storage
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Email
SENDGRID_API_KEY=<api-key>
FROM_EMAIL=noreply@suwamed.lk
```

Start the backend:

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

### Mobile App Setup

```bash
cd suwamed-mobile
npm install
```

Update the API URL in `src/config/constants.ts` to match your computer's local IP:

```typescript
export const API_URL = 'http://<your-local-ip>:5000/api';
```

Start the Expo development server:

```bash
npx expo start
```

Scan the QR code with your iPhone camera to open the app in Expo Go. Use `--tunnel` flag if your phone and computer are on different networks.

---

## Navigation Overview

### Patient (5 tabs)
- **Home** - Upcoming appointments, doctor search, health tips, quick actions
- **Appointments** - View, manage, and review appointments
- **Symptoms** - AI symptom checker with multilingual support
- **Records** - Health records, prescriptions, medication reminders
- **Profile** - Personal info, subscription, payment history, settings

### Doctor (5 tabs)
- **Dashboard** - Stats, today's appointments, appointment requests
- **Schedule** - Calendar view, set availability, manage slots
- **Patients** - Patient list, health records, prescription history
- **Earnings** - Revenue tracking, monthly breakdown, withdrawals
- **Profile** - Professional info, verification, reviews, settings

### Admin (5 tabs)
- **Dashboard** - Platform overview and key metrics
- **Users** - User management, pending doctor verifications
- **Management** - Specializations, system settings, health tips
- **Reports** - Revenue, user analytics, appointment analytics
- **More** - Admin profile, settings, notifications

---

## Security

- JWT access tokens (15 min) with refresh token rotation (7 days)
- Password hashing with bcrypt (12 salt rounds)
- OTP-based phone/email verification (6-digit, 5 min expiry)
- Role-based access control on all protected routes
- Rate limiting on authentication endpoints
- File upload restrictions (images + PDFs, 5 MB max)
- Admin-only doctor verification workflow

---

## License

This project is developed as a final year project.
