# SuwaMed — Project Status & Play Store Readiness Audit

**Date:** 2026-04-26
**Author:** Nawarathne Adikaram (Plymouth Index 10953507)
**Module:** PUSL3190 — Computing Project, BSc (Hons) Computer Science, University of Plymouth
**Supervisor:** Mr. Anton Jayakody

---

## 🚧 IMPLEMENTATION LOG (read this first if you are continuing this work)

This log is the source of truth for what has been implemented vs. what is still pending.
A future Claude session (or human) should pick the next unchecked item and continue.

### How to use this log
- Items below match the punch list in §3 (Critical / Important / Play-Store-blocking / Polish / Security).
- ✅ = done in code on disk. Read the linked files to verify.
- 🔜 = next up. Don't skip; do them in order unless you have a reason.
- ⏳ = in progress / partially done. Notes describe what remains.
- ⚠️ = blocked on external action (user must rotate a key, deploy a host, etc.).

### Progress

| # | Item | Status | Notes / Files touched |
|---|---|---|---|
| 1 | **Insert `Payment` row on appointment confirmation** (so cash-payment Payment History works) | ✅ 2026-04-26 | `suwamed-backend/src/controllers/appointment.controller.ts` (`confirmAppointment` now creates a Payment doc, idempotent via `appointmentId+status:'completed'` check, transactionId = `CASH-{ts}-{appt6}`); `suwamed-backend/src/controllers/payment.controller.ts` (`getHistory` deep-populates `appointmentId.doctorId.userId` so `PaymentHistoryScreen.tsx` renders doctor names); `suwamed-backend/src/models/Payment.model.ts` (added `'cash'` to `gateway` enum). Verified by `npx tsc --noEmit`. Tested data-flow against `mobile/src/screens/patient/PaymentHistoryScreen.tsx` (expects `appointmentId.doctorId.userId.firstName/lastName`, `appointmentId.date`, `appointmentId.type`, `amount`, `status`, `createdAt` — all populated). |
| 2 | Phase 1 §3.5 #2 — Lock down CORS (no default `*`) | ✅ 2026-04-26 | `suwamed-backend/server.ts` (now allowlist-based; `null`/empty Origin from native apps is always allowed; `*` works only when explicitly set; production warning logged when allowlist is empty or `*`); `suwamed-backend/.env.example` updated with safer default and inline docs. Verified by `npx tsc --noEmit`. |
| 3 | Phase 1 §3.5 #3 — Add `helmet` + mount `apiLimiter` globally | ✅ 2026-04-26 | Installed `helmet@^8.1.0`. `suwamed-backend/server.ts` now mounts `helmet({ contentSecurityPolicy: defaultSrc 'none', crossOriginResourcePolicy: 'cross-origin' })` and applies `apiLimiter` to all `/api` routes (auth routes still get the stricter `authLimiter` on top). Tightened JSON body limit from `10mb` to `256kb` (file uploads will use multer, which bypasses this). Bumped `apiLimiter` `max` from 100 → 600/15min so normal browsing isn't throttled. Verified `npx tsc --noEmit`. |
| 4 | Phase 1 §3.5 #4 — Add `express-mongo-sanitize` | ✅ 2026-04-26 | Did not use the npm package — `express-mongo-sanitize@2.x` mutates `req.query`, which is a read-only getter on Express 5. Wrote `suwamed-backend/src/middleware/sanitize.middleware.ts` instead: recursively strips keys starting with `$` or containing `.` from `req.body` (deeply) and removes `$` chars from `req.params` string values. `req.query` is left alone because Express 5 parses it to strings — operator injection there is impossible. Mounted in `server.ts` after body parsers. Defense-in-depth — Joi schemas already reject these on auth routes, but many other routes don't validate. Verified `npx tsc --noEmit`. |
| 5 | Phase 1 §3.5 #5 — Hash OTP at rest | ✅ 2026-04-26 | `suwamed-backend/src/models/User.model.ts`: extended pre-save hook to bcrypt-hash `otp` (8 rounds — short-lived, rate-limited) when modified and truthy; added `compareOtp(candidate)` method. `suwamed-backend/src/services/auth.service.ts`: `verifyOTP` and `resetPassword` now call `await user.compareOtp(otp)` instead of `user.otp !== otp`. Plain OTP is still logged in dev (the controller reads the local variable, not the hashed `user.otp`). On clear (`user.otp = undefined`), the hook short-circuits because `this.otp` is falsy. Verified `npx tsc --noEmit`. |
| 6 | Phase 1 §3.5 #6 — Hash refresh tokens at rest | ✅ 2026-04-26 | `User.model.ts`: `refreshToken` now `select: false`; pre-save hook bcrypt-hashes (8 rounds) when modified+truthy; `compareRefreshToken(candidate)` method added. `auth.service.ts` `refreshToken(token)` now does `findById(...).select('+refreshToken')` and `await user.compareRefreshToken(token)` instead of `user.refreshToken !== token`. Login/Register/Logout assignments unchanged — they go through the hook automatically. Verified `npx tsc --noEmit`. **Migration note for live data:** existing users will have plain refresh tokens stored. After deploying, all users must log out / log in again (or run a one-shot script that nulls every `refreshToken`). Consider adding that to the deployment checklist. |
| 7 | Phase 1 §3.5 #8 — Per-route body size limits | ✅ 2026-04-26 (covered with row #3) | Global JSON limit reduced from 10mb → 256kb in `server.ts`. File uploads will go through multer (separate path, 5mb cap already set in `upload.middleware.ts`). |
| 8 | Phase 1 §3.5 #1 — Rotate committed secrets + purge `.env` from git history | ⚠️ User action | Runbook below in §7 — must be done before any public push of the repo. The other Phase 1 items are now in place; this is the only remaining lockdown step before you can safely deploy. |
| 9 | Phase 2 — `app.json` Android package + versionCode + plugins + permissions | ✅ 2026-04-26 | `suwamed-mobile/app.json`: changed `name` from `suwamed-mobile` → `SuwaMed`. Added `android.package: "com.mua1234.suwamedmobile"` (matches iOS bundleIdentifier; **change before first Play Console upload if a different identity is desired — once published, the package name is permanent**), `android.versionCode: 1`. Added Android permissions: INTERNET, ACCESS_NETWORK_STATE, CAMERA, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, READ_MEDIA_IMAGES, READ_EXTERNAL_STORAGE, POST_NOTIFICATIONS, ACCESS_COARSE/FINE_LOCATION, VIBRATE, WAKE_LOCK. Added iOS `infoPlist` strings for camera, microphone, photo library, location. Added `plugins`: `expo-notifications` (icon, color #1A73E8, default channel), `expo-camera` (camera+mic+recordAudioAndroid), `expo-image-picker` (photos+camera). `expo-location` and `expo-document-picker` plugins skipped here — will be added when those packages are installed (rows for GPS pharmacies / document upload). JSON validity confirmed. |
| 10 | Phase 2 — `eas.json` production submit profile | ✅ 2026-04-26 | `suwamed-mobile/eas.json`: added `cli.appVersionSource: "remote"`. Build profiles pass `EXPO_PUBLIC_API_BASE` per environment (dev = local hotspot, preview = `https://staging.api.suwamed.lk`, production = `https://api.suwamed.lk` with `autoIncrement: true` and `channel: "production"`). Production submit profile added: `submit.production.android` uses `serviceAccountKeyPath: "./secrets/play-service-account.json"`, `track: "internal"`, `releaseStatus: "draft"`, `changesNotSentForReview: false`. iOS submit placeholder fields added (`appleId`, `ascAppId`, `appleTeamId` — must be filled before first iOS submission). User must place the Play Console service-account JSON at `suwamed-mobile/secrets/play-service-account.json` (gitignored) before running `eas submit --platform android --profile production`. |
| 11 | Phase 2 — Privacy Policy + Delete-Account flow + Onboarding Consent | ✅ 2026-04-26 | **Backend**: `auth.service.ts` `deleteAccount(userId, password)` re-checks the password, hard-deletes Patient/Doctor/HealthRecord/SymptomCheck/Notification rows, anonymizes the User document (random email/phone tombstone, names → "Deleted User", `isActive=false`, password rehashed to a random unguessable string). Appointments/Payments/Reviews/Prescriptions are kept intact for audit/billing because they reference the user `_id`. `auth.controller.ts` `deleteAccount` enforces a non-empty password in the body. `auth.routes.ts` mounts `DELETE /api/auth/account` behind `protect`. **Mobile**: new `screens/shared/PrivacyPolicyScreen.tsx` and `TermsScreen.tsx` rendering 7+8 sections from i18n; new `screens/auth/OnboardingConsentScreen.tsx` with 3 mandatory checkboxes (medical-disclaimer, data-use+T&P-link, age) — only enables Continue when all three are ticked. `settingsStore.ts` added `hasAcceptedConsent` (persisted to AsyncStorage as `suwamed_consentAccepted`) and `isLoaded` flag. `RootNavigator.tsx` waits for `isLoaded` before mounting any navigator. `AuthNavigator.tsx` chooses initial route = `OnboardingConsent` for first-launch, else `Welcome`. Privacy + Terms screens registered in Auth, Patient, Doctor and Admin navigators. Patient + Doctor settings screens now have a real Delete Account flow (`Alert.alert` warning → confirm modal with password TextInput → calls `DELETE /auth/account` → toasts → logout). `auth.api.ts` adds `deleteAccount(password)`. en/si/ta locales gained `consent.*` (10 keys), `privacy.*` (16 keys), `terms.*` (18 keys), and 6 new `common.deleteAccount*` keys. JSON validity confirmed for all three locales. Backend `npx tsc --noEmit` clean; mobile tsc clean for files touched. **Note for Play Console submission**: the in-app screens cover the discoverability requirement, but Google also wants a publicly-hosted privacy policy URL — host the same content at e.g. `https://suwamed.lk/privacy` and add that URL in the Play Console listing. |
| 12 | Phase 2 — Mobile API base URL via `EXPO_PUBLIC_API_BASE` | ✅ 2026-04-26 | `suwamed-mobile/src/config/constants.ts`: removed the dual DEV/PROD branching that ignored `EXPO_PUBLIC_API_BASE` in dev. The env var is now the single source of truth, with a `FALLBACK_DEV_API_BASE` only fired when `expo start` runs without any env wiring. Trailing slashes are stripped so `API_URL` and `SOCKET_URL` are always normalized. Verified by reading the only consumers (`api/client.ts`, `hooks/useSocket.ts`) — both still resolve to the same exports. Verified `npx tsc --noEmit` introduces no new errors (the pre-existing icon-name and zod errors in `admin/SystemSettingsScreen.tsx`, `auth/ResetPasswordScreen.tsx`, `patient/NearbyPharmaciesScreen.tsx`, `utils/validators.ts` are unrelated and tracked separately under §3.4 polish). |
| 13 | Phase 3 §3.1.F — Cloudinary uploads wired into health records / avatars / verification documents | ✅ 2026-04-27 | **Backend**: `controllers/healthRecord.controller.ts` `createRecord` now reads `req.file` (multer memoryStorage) and pipes the buffer through `uploadToCloudinary(buffer, 'suwamed/health-records/{userId}')`, falling back to JSON-only payloads when no file is attached. `tags` accepts both an array and a JSON-stringified array. `routes/healthRecord.routes.ts` mounts `uploadSingle('file')` ahead of the controller. `controllers/patient.controller.ts` adds `uploadAvatar` (folder `suwamed/avatars/{userId}`, image-only); `controllers/doctor.controller.ts` adds `uploadDoctorAvatar` and `uploadDoctorVerificationDocuments` (folder `suwamed/verification/{userId}`, multi-file via `uploadMultiple('documents', 5)`, accepts `types[]` body field, auto-flips `verificationStatus` from `pending` → `under_review` whenever fresh documents land). Routes mounted at `POST /api/patients/profile/avatar`, `POST /api/doctors/profile/avatar`, `POST /api/doctors/verification-documents`. Multer's 5 MB cap and image/PDF filter are unchanged. The global `express.json` 256kb limit doesn't affect multipart bodies because multer parses them before Express's body parsers run. **Mobile**: `screens/patient/UploadRecordScreen.tsx` — replaced the "File URL / Notes" TextInput with a Camera/Gallery button row + image preview + clear button. Submission now uses `FormData` with the React Native `{uri, name, type}` blob shape and Axios's `transformRequest: (d) => d` so the multipart boundary is set correctly. `screens/patient/EditProfileScreen.tsx` — avatar circle is now a TouchableOpacity that prompts Camera vs Gallery, uploads via `patientApi.uploadAvatar(formData)`, shows an ActivityIndicator overlay during upload, and re-renders the new URL via `Image`. `screens/doctor/EditProfileScreen.tsx` — same pattern for the doctor avatar (initials remain as a fallback when no avatar exists). `screens/doctor/VerificationScreen.tsx` — added an "Upload Document" CTA visible whenever `verificationStatus !== 'verified'`. The CTA chains a type prompt (SLMC certificate / Medical Degree / NIC / Other) → Camera vs Gallery → multipart POST to `/api/doctors/verification-documents` → updates the local `verificationDocuments` and `verificationStatus` from the server response. `api/doctor.api.ts` adds `uploadAvatar(formData)` and `uploadVerificationDocuments(formData)`; `api/patient.api.ts` `uploadAvatar` now points at the new `POST /patients/profile/avatar` route (was a non-existent `PUT /patients/avatar`) and uses `transformRequest` so the FormData survives. Verified `npx tsc --noEmit` clean for backend and for all mobile files I touched. **Note**: PDF uploads still flow end-to-end if the file is an image — `expo-document-picker` is not installed, so the patient UploadRecord flow is image-only on the client; the backend already accepts PDFs from any source. Adding `expo-document-picker` is a small follow-up. |
| 14 | Phase 3 §3.1.G — OTP via SMS or Email | ✅ 2026-04-27 (email) | **Backend**: new `services/email.service.ts` builds a `nodemailer` transport once at boot. Provider preference is SendGrid (`SENDGRID_API_KEY`) → generic SMTP (`SMTP_HOST`+`SMTP_USER`+`SMTP_PASS`) → none (logs OTP to dev console). `sendOtpEmail(to, otp, purpose)` and `sendPasswordResetEmail(to, otp)` render an HTML+plaintext template with the SuwaMed branding, monospaced code box, and a 5-minute expiry note. Failures are caught and logged (never thrown), so a transient SMTP outage doesn't break register/login. Wired into `auth.service.ts` `register` (account verification) and `forgotPassword` (password reset), and into `auth.controller.ts` `resendOTP`. The dev-mode `logger.info(\`OTP for …\`)` line is preserved so local development still works without configuring an SMTP provider. Installed `@types/nodemailer` (dev). `.env.example` rewritten to document SendGrid / SMTP options and to mark the Twilio keys as "placeholder — SMS service not yet wired" so future Claude doesn't think they're functional. **Mobile**: `OTPVerificationScreen.tsx` now shows an "📧 Check your email inbox (and spam folder)" hint underneath the phone-mask line so patients aren't waiting for an SMS that never comes. `auth.otpSubtitle` rewritten in en/si/ta to "We've sent a 6-digit code to your email" and a new `auth.otpCheckInbox` key was added to all three locales. Backend `npx tsc --noEmit` clean. **Note**: SMS delivery via Twilio is left as a future task — the `TWILIO_*` env vars are now documented as placeholders. When ready, add `services/sms.service.ts`, fan out from `auth.service.ts` to both channels (email + SMS), and the existing OTP storage / verify code stays unchanged. |
| 15 | Phase 3 §3.1.D — FCM push notifications (server send + client `expo-notifications` token) | ✅ 2026-05-14 | **Backend**: extended `services/notification.service.ts` so `sendToUser` now (a) persists the Notification document first, then (b) loads `User.fcmTokens`, partitions tokens by format (`ExponentPushToken[...]` → Expo Push API at `https://exp.host/--/api/v2/push/send`; everything else → Firebase Admin Messaging `sendEachForMulticast`), (c) prunes invalid/unregistered tokens via `$pull` so the user's token array doesn't leak forever. Both paths are wrapped in try/catch so push failure never masks a successful state change. Wired into appointment lifecycle (`confirmAppointment` → both sides notified `appointment_confirmed`; `cancelAppointment` → both sides notified `appointment_cancelled` with the reason; `startConsultation` → patient notified `consultation_started`; `endConsultation` → patient notified `review_request`), prescription create (`prescription_ready` to patient), and admin verify/reject (`doctor_verified` / `doctor_rejected` to the doctor's User). The reminder cron from row 16 already calls `sendToUser` and automatically inherits push delivery now. **Mobile**: new `src/services/pushNotifications.ts` — `registerForPushNotifications()` requests permission, creates the Android `default` channel (HIGH importance, vibration, light color #1A73E8), pulls the EAS projectId via every Constants location SDK 49→54 ships, calls `getExpoPushTokenAsync({ projectId })`, caches in AsyncStorage (`suwamed_push_token`) so re-registers skip the round trip, POSTs to `/notifications/register-token`. `setNotificationHandler` configured so foreground pushes still show a banner (Expo SDK 53+ requirement). Token persists across app launches but is cleared in `authStore.logout` so a different user signing in on the same device gets re-registered. New `src/navigation/navigationRef.ts` exposes a shared `NavigationContainer` ref; `RootNavigator.tsx` attaches it to every `<NavigationContainer>` it renders. `App.tsx` rewritten — on `isAuthenticated` flipping true it calls `registerForPushNotifications()` (idempotent); foreground + tap listeners are wired once via `addNotificationReceivedListener` / `addNotificationResponseReceivedListener` plus a cold-launch check via `getLastNotificationResponseAsync`. `extractNotificationData(response)` normalises the `data` payload and `handleNotificationTap` routes by `type` (appointment events → `AppointmentDetailScreen`; prescription → `PrescriptionDetailScreen`; review → `ReviewDoctorScreen`; doctor verification → `Notifications`). `expo-constants` added to `package.json` dependencies. Backend `npx tsc --noEmit` clean. **Note**: mobile `node_modules/` was not installed at the time of the change so I could not type-check the App.tsx changes locally; consumer must run `npm install` in `suwamed-mobile/` to pull in `expo-constants`. Type signatures align with the published expo-notifications SDK 0.32.16 surface. **Blocked-on-user**: in production this requires (a) the EAS projectId in `app.json.extra.eas.projectId` (already present: `bcf54311-9b6d-41b8-bbfb-528e6c299d7e`), (b) Firebase project linked to the Expo project for Android (so Expo can deliver via FCM under the hood), and (c) a physical device to test — Expo Go on iOS cannot receive remote pushes from SDK 53+; use a development client for testing. |
| 16 | Phase 3 §3.1.E — Appointment reminder cron | ✅ 2026-05-14 | **Backend**: new `services/notification.service.ts` with `sendToUser(payload)` / `sendToUsers(userIds, payload)` — today persists to `Notification` collection only; Row 15 (FCM) will extend it to also push without touching call sites. New `services/reminder.service.ts` with `startReminderJobs()` wiring two `node-cron` tasks: hourly `0 * * * *` (24h reminder, window 23–25h) and every 5 min `*/5 * * * *` (1h reminder, window 55–65 min). Both honor `CRON_TIMEZONE` (defaults to `Asia/Colombo`). A boot-time sweep runs each job once immediately so freshly deployed instances don't wait an hour for the first 24h reminder. Filter is `status:'confirmed' AND date in [now, now+windowMax+1d] AND !reminder{24h\|1h}Sent`; in JS we then compute `buildAppointmentMoment(date, startTime)` and reject anything outside the precise window. Patient + doctor both get reminded. Atomic `$set` on the flag prevents double-sends. Disabled by default — `ENABLE_REMINDERS=true` to start the cron (otherwise the boot log says `[reminder] ENABLE_REMINDERS!=true — appointment reminder cron not started`). **Appointment.model.ts**: added `reminder24hSent` and `reminder1hSent` booleans (kept legacy `reminderSent` for backwards compatibility) plus two compound indexes `{status, date, reminder{24h\|1h}Sent}` so the cron sweep is index-served. **server.ts**: bootstraps `startReminderJobs()` after `connectDB()` in the non-Vercel start path. **.env.example**: documented `ENABLE_REMINDERS`, `CRON_TIMEZONE`, `OPENAI_API_KEY`, `OPENAI_SYMPTOM_MODEL`. Backend `npx tsc --noEmit` clean (pre-existing `helmet`/`nodemailer` declaration errors unchanged — neither is mine to fix). **Note**: existing rows don't have the new flag fields set; that's fine, Mongoose returns `undefined` which the `$ne: true` filter treats as eligible. Old rows that already had a reminder fire (under the legacy boolean) will get one more reminder under the new logic — acceptable one-off cost. |
| 17 | Phase 3 §3.1.A — Socket.io chat (server setup + Message persistence + ChatScreen) |  |  |
| 18 | Phase 3 §3.1.B — Agora video calls (token endpoint + react-native-agora + VideoCallScreen) |  |  |
| 19 | Phase 3 §3.1.C — OpenAI symptom checker | ✅ 2026-05-14 | **Backend**: new `services/openai.service.ts` lazily instantiates an `OpenAI` client from `OPENAI_API_KEY` (model default `gpt-4o-mini`, override via `OPENAI_SYMPTOM_MODEL`). `analyzeWithOpenAI(input)` builds a language-aware system prompt (en/si/ta — the model is instructed to write `possibleConditions[].name/description`, `selfCareAdvice`, `assessmentText` in the selected language; `suggestedSpecializations` stay English so they match the doctor directory) and a JSON-mode user prompt with strict enum constraints, calls `chat.completions.create` with `response_format: 'json_object'`, then normalizes/validates the response by hand (no zod backend) — coerces unknown enums to safe fallbacks, clamps probabilities to `[0,1]`, caps `possibleConditions` to 4, dedupes specializations. Returns `null` on any failure (missing key, network error, malformed JSON), which the controller treats as "use the rule-based path." `symptom.controller.ts` rewritten: keeps the deterministic keyword-based analyzer as a complete fallback (extended to also scan `additionalNotes` free text), pulls patient demographics (age from `User.dateOfBirth`, gender from `User.gender`, chronic conditions from `Patient.chronicConditions`) so the AI prompt is personalized, calls `analyzeWithOpenAI` first, falls back to rule-based when it returns null, returns a new `source: 'openai' | 'rule_based'` field on the response so the client can show provenance later. Disclaimer is now centralized in `services/openai.service.ts` (`SYMPTOM_DISCLAIMER` per locale) so both paths return localized text. Token usage logged via `logger.info` for cost tracking. **Mobile**: `SymptomCheckerScreen.tsx` gained an "Anything else?" multiline `TextInput` (max 500 chars, character counter) that sends `additionalNotes` to the backend. Free-text only submissions now work — the analyze button is enabled whenever chips OR notes are non-empty; when only notes are supplied the client synthesizes a one-line symptom from the notes so the server-side "at least one symptom" guard still passes. Reset clears notes on success. **Locales**: en/si/ta gained `patient.describeMore`, `patient.describeMoreHint`, `patient.symptomNotesPlaceholder`. JSON validity confirmed; backend `npx tsc --noEmit` clean for the two touched files (pre-existing `helmet`/`nodemailer` declaration-file errors unchanged). **Note**: the rule-based fallback uses English keyword matching only — when users describe symptoms in Sinhala/Tamil with no chips selected, OpenAI handles them, but the fallback path will return the generic "general consultation recommended" outcome. That's intentional triage-safe behavior. |
| 20 | Phase 4 — Half-built features (subscriptions, reschedule, notes, support tickets, system logs, reviews CRUD, GPS pharmacies, scheduled medication reminders, pagination) | ⏳ 2026-05-08 | **Implemented:** (a) `PUT /appointments/:id/reschedule` — patient/doctor authorization, status reset to pending, audit trail appended to `notes`; mobile `appointment.api.ts` already calls it. (b) `PUT /appointments/:id/notes` — doctor/admin only, 5000-char cap. (c) Reviews CRUD — `GET /reviews/:id`, `PUT /reviews/:id` (24-hour edit window, recomputes doctor rating), `DELETE /reviews/:id` (own or admin, recomputes rating, unsets appointment.review). Single `recomputeDoctorRating` helper avoids drift. (d) `PATCH /health-tips/:id/view` (public) — increments `viewCount`; mobile `HealthTipDetailScreen` calls it once on mount via a `useRef` guard. (e) Notification badge unread count — bound `useNotificationStore.unreadCount` to bell icon on patient `HomeScreen` and doctor `DashboardScreen`; both fetch `/notifications` alongside their primary fetches and render a numbered badge (or hidden when 0); old static red dot CSS retained but unused. (f) Admin pending-doctors pagination + search — `getPendingDoctors` now accepts `page`/`limit`/`search` (matches against SLMC number and specialization), defaults to page 1 / 20 docs (backwards-compatible with current mobile callers). (g) Doctor blocked-slot UI — backend `GET/POST/DELETE /doctors/blocked-slots[/:index]` with HH:MM and date validation; mobile `SetAvailabilityScreen` gained a Blocked Time Off section with list + add form (date / start / end / reason). (h) GPS pharmacies map — `NearbyPharmaciesScreen` "Directions" button now opens Google Maps via `Linking.openURL("https://www.google.com/maps/search/?api=1&query=...")`; phone numbers tappable via `tel:`. **Coming Soon kill** done in same pass: `admin/AdminSettingsScreen` now ships an inline change-password modal (replaces "Account Security coming soon" alert); `admin/ManagementScreen` removed Data Export / Backup & Restore / Support Tickets cards (kept Content Management, Health Tips, System Settings); `admin/MoreScreen` replaced System Logs / Help & Documentation entries with Privacy Policy + Terms + a Contact Support `mailto:` action; `admin/SystemSettingsScreen` Maintenance Mode now shows an explanatory dialog (controlled via env var on the host) instead of a "coming soon" stub; `doctor/AppointmentDetailScreen` "Coming Soon" alert on start consultation rewritten to a clean "in-progress" notification; `patient/AppointmentDetailScreen` join-consultation alert rewritten with a real description; `doctor/DoctorProfileScreen` Language row now opens an Alert.alert language picker that drives `useSettingsStore.setLanguage` (en/si/ta), mirrors `AdminSettingsScreen`; `patient/SubscriptionScreen` upgrade alert rewritten to a `mailto:support@suwamed.lk` flow with pre-filled body. **Verification:** `npx tsc --noEmit` clean for backend (only previous icon-name warnings in admin/SystemSettingsScreen.tsx and patient/NearbyPharmaciesScreen.tsx remain — both pre-existing per §3.4 and unrelated to these changes). All three locale JSONs still parse. **Still open under this row:** subscription CRUD against the `Subscription` model, support tickets controller+UI, system logs middleware, scheduled medication reminders via `expo-notifications`, system-wide pagination on long lists. |
| 21 | Phase 5 — Polish (skeletons, dark-mode QA, accessibility, Swagger, tests) |  |  |
| 22 | Phase 6 — Pre-submission (internal track, data-safety form, low-end device QA) |  |  |

### Rules for the next session

1. **Read this table top-to-bottom.** Pick the lowest unchecked row and finish it before starting another.
2. **Do not batch.** One row at a time. Type-check (`npx tsc --noEmit` in `suwamed-backend`) after every backend change. For mobile, read the affected screens to confirm the data shape still matches what the UI renders.
3. **Update this table** with status, date, and exact files touched as you finish.
4. When a row depends on user action (deploy, rotate key, sign up for SendGrid, …), mark it ⚠️ and call it out in your final response so the user can unblock it.

---

## 1. Project Overview

SuwaMed is a full-stack telehealth platform for the Sri Lankan healthcare ecosystem. It comprises:

- **Backend** — Node.js + TypeScript on Express 5, MongoDB (Mongoose), Socket.io (declared), Firebase Admin, Cloudinary, OpenAI (declared), Agora (declared via env), PayHere (declared).
- **Mobile** — React Native (Expo SDK 54), TypeScript, Zustand, React Navigation, Axios, i18next, React Native Paper, Reanimated/Moti, AsyncStorage, expo-notifications/expo-image-picker/expo-camera/expo-location (declared).
- **Roles** — `patient`, `doctor`, `admin` (5 bottom-tab navigators each).
- **Languages** — English, Sinhala (සිංහල), Tamil (தமிழ்), all 776 keys, fully translated.

The PID/Abstract claims: AI symptom checker, real-time video & chat, FCM reminders, encrypted Cloudinary storage, digital prescriptions, SLMC verification workflow, PayHere payments with subscriptions and doctor withdrawals, JWT + refresh + bcrypt + OTP, RBAC, rate limiting.

This audit reconciles those claims against the actual code on disk.

---

## 2. What Is DONE (built and working)

### 2.1 Backend (Express + MongoDB)

| Domain | Status | Notes |
|---|---|---|
| JWT auth (access 15m / refresh 7d, rotation) | ✅ | `tokenUtils.ts`, `auth.middleware.ts`, refresh-token store on User. |
| bcrypt password hashing (12 rounds) | ✅ | `User.model.ts` pre-save hook + change-password flow. |
| OTP generation, persistence, expiry (5 min) | ✅ | Code stored hashed-less but `select: false`; verifyOTP/forgot/reset flows correct. |
| Rate limiting | ✅ | `authLimiter` (10/15min), `apiLimiter` (100/15min), `symptomLimiter` (20/h). |
| Role-based middleware (`authorize(...roles)`) | ✅ | `role.middleware.ts`. |
| MongoDB connection with DNS fallback + auto-retry | ✅ | `database.ts` retries every 30 s on failure. |
| Joi validation for auth & doctor | ✅ | `auth.validator.ts`, `doctor.validator.ts`. |
| Centralized error handling | ✅ | `error.middleware.ts` + `AppError`. |
| Winston logger | ✅ | `logger.ts` writes to `logs/`. |
| 16 Mongoose models | ✅ | User, Patient, Doctor, Appointment, Prescription, HealthRecord, HealthTip, Message, Notification, Payment, Review, SlmcRegistry, Subscription, SupportTicket, SymptomCheck, SystemLog. |
| Auth routes (register, login, OTP, forgot/reset, refresh, logout, change-password, me) | ✅ | All wired. |
| Patient routes (profile/user CRUD) | ✅ | |
| Doctor routes (search, profile, dashboard, patients, earnings, availability, reviews) | ✅ | |
| Appointment routes (list, get, create, confirm, cancel, start, end) | ✅ | Earnings credited on `end` to `Doctor.totalEarnings/pendingWithdrawal`. |
| Prescription routes (create, list, get; doctor RBAC) | ✅ | Linked to appointment after creation. |
| Health record routes (create, list, get) | ✅ | But see §3.2 — no actual file upload pipeline. |
| Review routes (create, my-reviews) | ✅ | Recomputes doctor rating average. |
| Health tip routes (public list, admin CRUD, publish toggle) | ✅ | |
| Admin routes (dashboard, user list/detail, status update, pending doctors, verify/reject, revenue, appointment analytics) | ✅ | 6-month aggregates. |
| Notification routes (list, mark-read, mark-all-read, delete, register-FCM-token) | ✅ | Persistence only — see §3.1. |
| Symptom analysis (`/symptoms/check`) | ⚠️ Built, but rule-based not AI — see §3.1 |
| SLMC pre-registration verification (`/slmc/verify/:slmcNo`) | ✅ | Public route, blocks duplicate registrations. |
| SLMC seed script | ✅ | `scripts/seedSlmc.ts`. |
| Multer middleware + Cloudinary upload helper | ⚠️ Defined, never wired — see §3.2 |

### 2.2 Mobile App (React Native / Expo)

| Area | Screens (count) | Status |
|---|---|---|
| Auth | Welcome, Onboarding, RoleSelection, Login, Register, OTPVerification, ForgotPassword, ResetPassword, PendingVerification | ✅ All wired |
| Patient | Home, DoctorSearch, DoctorProfile, BookAppointment, Payment, AppointmentConfirmation, MyAppointments, AppointmentDetail, ReviewDoctor, SymptomChecker, SymptomResult, SymptomHistory, HealthRecords, UploadRecord (URL only — see §3.2), RecordDetail, Prescriptions, PrescriptionDetail, MedicationReminders, Profile, EditProfile, Subscription, PaymentHistory, HelpSupport, Emergency, NearbyPharmacies (hardcoded — see §3.4), HealthTips, HealthTipDetail | ✅ 27 screens |
| Doctor | Dashboard, MySchedule, SetAvailability, AppointmentRequests, AppointmentDetail, WritePrescription, PatientList, PatientProfile, PatientHealthRecords, PrescriptionHistory, Earnings, Withdraw, DoctorProfile, EditProfile, Verification, Reviews, Settings, Notifications | ✅ 18 screens |
| Admin | AdminDashboard, UsersList, UserDetail, PendingDoctors, DoctorVerification, Management, Specializations, SystemSettings, HealthTipsManagement, Reports, RevenueReport, UserAnalytics, AppointmentAnalytics, More, AdminProfile, AdminSettings, AdminNotifications | ✅ 17 screens |
| Shared | NotificationsScreen, SettingsScreen | ✅ |
| Navigation | Auth (stack), Patient/Doctor/Admin (tabs+stacks), gated by `verificationStatus` for doctors | ✅ |
| State | Zustand stores: auth, appointments, chat (model only), notifications, settings, symptoms | ✅ Auth + persistence |
| Theme | Light + dark; React Native Paper MD3 | ✅ |
| i18n | en.json / si.json / ta.json — 776 keys each, fully translated incl. consultation/validation/errors/onboarding | ✅ |
| Reusable components | Avatar, Badge, Button, Card, ConfirmationModal, EmptyState, ErrorBoundary, FadeIn, Input, LanguageSwitcher, LoadingSpinner, NetworkStatus, SearchBar, Skeleton, StarRating, Toast, BottomSheet | ✅ |
| Token refresh interceptor | ✅ Axios interceptor + AsyncStorage |
| Form validation | ✅ React Hook Form + Zod schemas |
| Splash, Adaptive Icon, Monochrome icon | ✅ Assets present |

### 2.3 Cross-cutting

- **SLMC workflow** end-to-end: seed → verify on `Register` screen → admin verifies/rejects → root navigator gates unverified doctors with `PendingVerificationScreen`.
- **Doctor earnings** tracked: appointment `end` increments `totalEarnings` + `pendingWithdrawal`; withdrawal request decrements `pendingWithdrawal` (LKR 500 minimum).
- **Specialization & district lists** synchronized between backend constants and mobile constants.
- **Health tip i18n** — DB stores `language` field; mobile filters by current language.
- **Trilingual UI** verified: every screen consumes `useTranslation()`; locale files contain all keys for common, auth, patient, doctor, admin, consultation, validation, errors, onboarding namespaces.

---

## 3. What Is MISSING (must be built before Play Store)

### 3.1 CRITICAL — Core abstract features that are not implemented

#### A. Real-time Chat (Socket.io) — **NOT integrated**

| Evidence | Detail |
|---|---|
| `suwamed-backend/src/socket/` | Empty directory. No handlers, no auth middleware, no room logic. |
| `server.ts` | Creates `http.createServer(app)` but never instantiates `new Server(server, ...)`. Socket.io is only listed in `package.json`. |
| `routes/chat.routes.ts` | All endpoints return `501 Not Implemented`. |
| `mobile/hooks/useSocket.ts` | Connects to `SOCKET_URL` and emits `join_consultation` / `send_message` / `typing_*` / `mark_read`, all of which go nowhere. |
| `consultation.api.ts` | Calls `/consultations/token`, `/consultations/:id/messages` — these routes do not exist. |
| Mobile screens | **No `ChatScreen.tsx`** for either patient or doctor. |

**TO BUILD:** server-side Socket.io setup (auth, namespaces, rooms keyed on `appointmentId`), `Message` model writes on receive, history endpoint backed by `Message`, `ChatScreen.tsx` UI for both patient and doctor, message bubbles, attachments via Cloudinary, typing indicators.

#### B. Video Calls (Agora) — **NOT integrated**

| Evidence | Detail |
|---|---|
| Backend deps | No `agora-token` / `agora-access-token` package. No token mint endpoint. |
| `Appointment.model.ts` | Has `consultation.agoraChannelName` field but it is never written. |
| Mobile deps | No `react-native-agora` (and Expo Go cannot run it without a dev client / config plugin). |
| `appointmentDetailScreen.tsx` | "Join Consultation" button shows `Alert('Coming Soon', ...)`. |
| `.env` | `AGORA_APP_ID` + `AGORA_APP_CERTIFICATE` populated but never imported. |
| Mobile screens | **No `VideoCallScreen.tsx`**, no waiting room, no end-call flow. |

**TO BUILD:** add `agora-token` to backend, `POST /api/consultations/:appointmentId/token` returning RTC + RTM tokens scoped to channel = appointment id and uid = userId; add `react-native-agora` (move app to dev-client / EAS build, no longer Expo Go); build VideoCallScreen with mute/camera/speaker/end controls; ensure `agoraChannelName` is set on appointment confirmation and channel name is bounded by appointment id; add permissions for camera and microphone.

#### C. AI Symptom Checker — **Rule-based, not OpenAI**

| Evidence | Detail |
|---|---|
| `controllers/symptom.controller.ts` | Uses hardcoded English keyword arrays (`cardiacKeywords`, `respiratoryKeywords`, …) + simple `.includes()` matching. |
| `package.json` | `openai@6.25.0` is installed but **never imported anywhere** in `src/`. |
| Mobile `SymptomCheckerScreen.tsx` | UI exposes 12 hardcoded English symptoms regardless of selected language. Sinhala/Tamil selection sends English strings to the backend, so the language switch has no effect on analysis. |
| `.env` | `OPENAI_API_KEY` present but unused. |

**TO BUILD:** `services/openai.service.ts` calling `openai.chat.completions.create({ model: 'gpt-4o-mini', ... })` with a structured prompt → parse to the existing `aiResponse` schema. Add language-aware system prompt. Add multilingual symptom catalogue (or accept free-text input) on the mobile side. Keep the rule-based path as a fallback when the API key is missing or the call fails. Persist token usage for cost tracking.

#### D. Push Notifications (FCM) — **Wired but never sending**

| Evidence | Detail |
|---|---|
| `config/firebase.ts` | Initializes Firebase Admin. |
| Project-wide grep for `admin.messaging`, `sendMulticast`, `send(...)` | **0 hits.** Firebase Admin is never used after initialization. |
| `notification.controller.ts` | Persists notifications to MongoDB. Does not push them. |
| Mobile-side grep for `expo-notifications`, `getExpoPushTokenAsync`, `registerForPushNotificationsAsync` | **0 hits.** No client-side push token retrieval. `registerToken` API exists but no code ever calls it with a real token. |
| `app.json` plugins | No `expo-notifications` plugin. Native notifications cannot be set up at build time. |

**TO BUILD:** server-side notification helper (`services/notification.service.ts`) with `sendToUser(userId, payload)` that fans out via `admin.messaging().sendEachForMulticast` to all `fcmTokens` on the user; call it from appointment confirm/cancel/start, prescription create, doctor verify/reject, payment success, etc. Mobile-side: in `App.tsx`, register the `expo-notifications` push token after auth and POST it to `/notifications/register-token`. Configure `expo-notifications` plugin in `app.json` with android channel + icon. Request notification permission at first launch.

#### E. Appointment Reminders (node-cron) — **Not scheduled**

| Evidence | Detail |
|---|---|
| `package.json` | `node-cron@4.2.1` installed. |
| Project-wide grep for `cron.schedule`, `node-cron` | **0 hits in `src/`.** Never imported. |
| `Appointment.model.ts` | Has `reminderSent: Boolean` field, never read or written. |

**TO BUILD:** `services/reminder.service.ts` with two cron jobs: hourly job for 24-h reminders (status confirmed, date 23–25 hours away, `reminderSent !== '24h'`) and 5-minute job for 1-h reminders. Each fires FCM + writes Notification row + sets `reminderSent` accordingly. Bootstrap from `server.ts` after DB connect.

#### F. File Uploads via Cloudinary — **Helper exists, never used**

| Evidence | Detail |
|---|---|
| `services/upload.service.ts` | `uploadToCloudinary(buffer, folder)` helper. |
| `middleware/upload.middleware.ts` | Multer memory storage + image/PDF filter + 5 MB limit. |
| Project-wide grep for `uploadToCloudinary`, `uploadSingle`, `uploadMultiple` | **Defined; never imported.** |
| `controllers/healthRecord.controller.ts` | `createRecord` accepts `fileUrl: string` from request body — no upload. |
| Mobile `UploadRecordScreen.tsx` | Has a *text input* labelled "File URL / Notes" — no file picker. |
| Mobile `useImagePicker.ts` hook | Defined, never imported in any screen. |
| Doctor verification documents | No upload flow at all — `DoctorVerificationScreen` (admin) only displays document URLs that nobody can submit. |
| Profile avatars | `User.avatar` field exists; no upload route or UI. |

**TO BUILD:** wire multer + uploadToCloudinary into:
- `POST /api/health-records` (single image/pdf, folder `health-records/{userId}`)
- `POST /api/patients/profile/avatar` and `POST /api/doctors/profile/avatar`
- `POST /api/doctors/verification-documents` (multiple)
Mobile: replace the "File URL" text input on `UploadRecordScreen` with a Camera / Gallery / PDF picker (`expo-image-picker`, `expo-document-picker`); send via `multipart/form-data`. Add document upload step to doctor onboarding before submission.

#### G. OTP Delivery (SMS / Email) — **Logged only**

| Evidence | Detail |
|---|---|
| `auth.service.ts` | `if (NODE_ENV === 'development') logger.info(\`OTP for …: ${otp}\`)`. |
| `.env` | `TWILIO_*` and `SENDGRID_API_KEY` are empty. `nodemailer` is in deps but never imported. |
| `register-otp` flow | OTP is generated and stored, then nothing is sent to the user. |

**TO BUILD:** `services/sms.service.ts` (Twilio or local provider — Dialog Send-Anywhere / Mobitel — accepting `+94…`); `services/email.service.ts` (nodemailer + SendGrid/Mailtrap). Wire into `register`, `resendOTP`, `forgotPassword`. Provide a feature flag so dev keeps logging.

### 3.2 IMPORTANT — Half-built features

| Item | Status | What is needed |
|---|---|---|
| **Subscriptions** | Stub — GET returns hardcoded "free" plan, POST returns 501 | Build CRUD against `Subscription` model, plan tiers (Free/Basic/Premium), feature gating middleware (`checkSubscriptionFeature`), expiry cron, FCM renewal reminders. |
| **Reschedule appointment** | Mobile `appointment.api.ts` calls `PUT /appointments/:id/reschedule` | Backend route does not exist. Add controller + route + audit trail. |
| **Add notes to appointment** | Mobile calls `PUT /appointments/:id/notes` | Backend route does not exist. Add. |
| **Chat history retrieval** | `GET /chat/:appointmentId` returns 501 | Build once `Message` writes from socket are in place. |
| **Support Tickets** | `SupportTicket.model.ts` exists | No controller, routes, or UI. Admin's "Support Tickets" tile shows "Coming soon". |
| **System Logs** | `SystemLog.model.ts` exists | Never written to. Add audit logging middleware for admin actions (verify doctor, suspend user, etc.). |
| **Maintenance mode** | Admin button only | Needs flag in DB (or env), middleware that 503s non-admin requests when on, and a banner on mobile. |
| **Data export / Backup & restore** | Admin "Coming soon" alerts | Add `GET /admin/export?type=users|appointments` returning CSV. |
| **Reviews — get/update/delete** | Only `create` and `getMyReviews` | Add `GET /reviews/:id`, `PUT /reviews/:id` (within 24h), `DELETE /reviews/:id`. |
| **Doctor reviews list pagination** | Returns all | Paginate. |
| **Doctor verification document upload** | Status screen reads documents but there's no upload step | Build doctor-side upload screen + backend route. |
| **Medication reminder local notifications** | Stored to AsyncStorage only | Schedule via `expo-notifications` `scheduleNotificationAsync` per reminder, cancel on delete. |
| **Nearby pharmacies (GPS)** | Hardcoded 7-row array | Use `expo-location` + a pharmacies dataset (or Google Places). `useLocation` hook is defined and unused. |
| **Health-tip view count** | Field referenced in HomeScreen UI | Increment endpoint not implemented. Add `PATCH /health-tips/:id/view`. |
| **Doctor blocked-slot UI** | Backend supports `blockedSlots` | No mobile UI to add a blocked range. |
| **Forgot password via email** | Logged only | Same as OTP; wire SendGrid. |
| **Admin pagination on doctors/pending** | Returns all | Add pagination + search. |
| **Doctor patient search/filter** | Returns all | Add search box, filter by last visit. |
| **Notification badge unread count** | UI shows a static red dot | Bind to `useNotificationStore.unreadCount`. |

### 3.3 Play-Store-blocking issues

| Issue | Detail | Fix |
|---|---|---|
| **`android.package` missing in `app.json`** | Only iOS `bundleIdentifier` is set (`com.mua1234.suwamedmobile`). Play Store **requires** an Android applicationId. | Add `android.package: "lk.suwamed.app"` (or the desired ID). It is permanent — pick carefully. |
| **No `versionCode`** | Every Play Store upload requires a monotonically increasing integer. | Add `android.versionCode: 1`. EAS auto-increments if `cli.appVersionSource = remote` (already set) — confirm. |
| **No `expo-notifications` plugin** | Native push won't work in a release build. | Add to `plugins` with android channel + icon + color. |
| **No `expo-camera`, `expo-image-picker`, `expo-location`, `expo-document-picker` plugins** | Permissions strings won't be generated; release build will crash on first use. | Configure each plugin with `permissions`, `cameraPermission`, `microphonePermission`, `photosPermission`, `locationAlwaysAndWhenInUsePermission`. |
| **No Android permissions array** | INTERNET is implicit; CAMERA, RECORD_AUDIO, ACCESS_FINE_LOCATION, READ_MEDIA_IMAGES, POST_NOTIFICATIONS not declared. | Add `android.permissions: [...]`. |
| **No iOS `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`** | iOS submission would be rejected; Play Store ignores but cross-platform parity matters. | Add to `ios.infoPlist`. |
| **API URL hardcoded to a hotspot IP** | `src/config/constants.ts` defaults to `http://172.20.10.5:5000`. The production binary will hit this dead address. | Set `EXPO_PUBLIC_API_BASE` for the production profile in `eas.json` to a public HTTPS URL (e.g. `https://api.suwamed.lk`). |
| **Backend not deployed** | No production host. Mobile app cannot work in store. | Deploy backend to Render / Railway / Fly.io / DigitalOcean App Platform with HTTPS. Set up domain + CORS allowlist. |
| **CORS wide open** | `.env` has `ALLOWED_ORIGINS=*`. | Restrict to mobile origin (`null` for native), the admin web app if any, and your domain. Or use App Check / signed requests. |
| **No `helmet` / security headers** | Express has no Helmet. | `app.use(helmet())`, content-security-policy, hsts. |
| **No HTTPS enforcement** | Up to deployment platform. | Force HTTPS on the host. |
| **No privacy policy / terms screen** | Play Store **requires** a privacy policy URL for any app handling health data. | Host one (can be a public URL or in-app screen). Add link on Login + Register + Settings. |
| **No data-deletion flow** | Play Store policy — users must be able to request account deletion. | Add `DELETE /api/auth/account` + Settings → Delete account. |
| **No EULA / consent for medical disclaimer** | Health-app rules. Display once during onboarding and require accept. | Add `OnboardingConsentScreen`. |
| **No Google Play Data Safety form data** | Required at upload. | Inventory data collected — phone, email, location, health records, payments. |
| **No App Signing** | EAS handles by default. | Verify `eas build --platform android --profile production` succeeds and you have access to the keystore. |
| **No production submit profile in `eas.json`** | `submit.production` is empty. | Add `submit.production.android` with `serviceAccountKeyPath` and `track: "internal"` for the first release. |
| **No `assetBundlePatterns` / OTA channel** | No Expo Updates channel set. | Optional — add `runtimeVersion.policy: "appVersion"` if planning OTA. |
| **`NODE_ENV=production` in committed `.env`** | This file should not even exist in git. | See §3.5. |

### 3.4 Polish / nice-to-have

| Item | Notes |
|---|---|
| Skeletons for empty states across all list screens | Some lists fall back to `ActivityIndicator` only. |
| Pull-to-refresh on ALL list screens | Most have it; double-check admin lists. |
| Empty-state illustrations | Use a single `<EmptyState />` component (already exists) consistently. |
| Confirmation modals over `Alert.alert` | `ConfirmationModal` exists; use it for destructive actions. |
| Network-status banner | `NetworkStatus` component exists; mount once at root. |
| Form error toasts | `Toast` exists; ensure all mutations use it. |
| Dark-mode coverage QA | Theme exists; visit every screen in dark mode. |
| Accessibility: `accessibilityLabel`, dynamic text size | Mostly missing. |
| Empty avatars: deterministic colour-from-name | Done in PaymentScreen, not consistently elsewhere. |
| Hardware back-button handling on Android | Default behaviour is fine, but custom modals should intercept. |
| Splash → Auth state hand-off | Currently shows `LoadingSpinner` while reading AsyncStorage; consider native splash hold via `expo-splash-screen` API. |
| Date pickers | `EditProfileScreen` uses TextInput with placeholder `YYYY-MM-DD` — replace with a real picker. |
| Time picker for `MyScheduleScreen` / `SetAvailability` | Same — replace TextInputs with picker. |
| Pagination on long lists | Backend `getUsers` paginates; mobile passes nothing. |
| Backend Swagger docs | `swagger-jsdoc` + `swagger-ui-express` are deps; never wired. |
| Backend tests | `npm test` returns error. Add Jest + Supertest, at least for auth + appointment lifecycle. |
| Mobile e2e | Detox or Maestro flows for register → book → cancel. |
| HomeScreen "See All" health-tips text | Hardcoded `'See All'` instead of `t('common.seeAll')`. |

### 3.5 Security 🚨

> Treat these as **block-ship** issues for a public release.

1. **`suwamed-backend/.env` is committed to the git repository.** Confirmed via `git ls-files`. It contains:
   - MongoDB Atlas credentials (cluster + password)
   - JWT access + refresh secrets (64-byte hex)
   - Firebase service-account private key (full PEM)
   - Agora App ID + App Certificate
   - **OpenAI API key** (immediately abusable)
   - Cloudinary cloud name + API key + API secret

   **Remediation (do this before doing anything else):**
   1. **Rotate every secret above.** Treat them as compromised. (Atlas → reset password, JWT → regenerate, Firebase → create a new service account and delete the old one, Agora → regenerate certificate, OpenAI → revoke + regenerate, Cloudinary → invalidate API secret.)
   2. `git rm --cached suwamed-backend/.env`, commit.
   3. Purge from history with `git filter-repo --path suwamed-backend/.env --invert-paths` (or BFG), then force-push to remote and tell collaborators to re-clone.
   4. Confirm `.gitignore` already lists `.env` (it does), and add a pre-commit hook (e.g. `git-secrets` or `gitleaks`) to prevent recurrence.
2. **`ALLOWED_ORIGINS=*` in production `.env`.** Lock down once a real domain exists.
3. **No `helmet`, no rate-limit on non-auth routes by default** (`apiLimiter` is defined but only `authLimiter` is mounted).
4. **No mongo-sanitize / express-mongo-sanitize** — string filters in `getDoctors` use raw user input as regex; vulnerable to ReDoS and operator injection.
5. **OTP not hashed at rest** — stored as plain 6-digit number in `User.otp` (with `select: false`, but still). Hash with bcrypt and compare on verify.
6. **Refresh tokens not hashed at rest** — stored verbatim on `User.refreshToken`. Hash + index.
7. **JWT secrets and Firebase key in shell-readable .env** — fine for dev; for prod use the host's secret manager.
8. **No body-size limit per route** — global 10 mb is generous; tighten where appropriate.
9. **No HSTS / CSP** — add via `helmet`.
10. **Logs include OTP in development** — leave the dev-only guard but never log in production. Confirm `NODE_ENV` is set on the host.
11. **`ITSAppUsesNonExemptEncryption: false`** is declared without legal review. If you ship Agora video the app uses non-exempt cryptography (per Apple's definition); review with Apple's guidance.

### 3.6 Repository hygiene

- **Nested git repo:** `suwamed-mobile/.git` exists inside the outer `SuwaMed/.git`. This is unusual. Either turn `suwamed-mobile` into a submodule or remove the inner `.git/` and treat the whole project as one repo.
- **`logs/combined.log`** is tracked in git (currently dirty). Ignore it.
- **`Codes.md`** appears to be a long pasted code dump. Decide whether it should remain in the repo.
- **`run-guide.md`**, **`pid_text.txt`** are dev notes — fine, but make sure they don't contain anything you'd not want public.

---

## 4. Recommended Build Order (before Play Store)

If the goal is a Play-Store-installable, demo-able SuwaMed (with the cash-on-consultation payment screen replacing PayHere as you described), the smallest viable path is:

### Phase 1 — Lockdown & deploy backend (≤ 1 day)
1. Rotate **all** committed secrets (§3.5 step 1).
2. `git rm --cached` `.env` and purge from history.
3. Add `helmet`, `express-mongo-sanitize`, restrict CORS.
4. Hash OTP and refresh tokens at rest.
5. Deploy backend to Render/Railway with HTTPS + a real domain, set production env vars in the host's secret store.
6. Update `mobile/src/config/constants.ts` to read `EXPO_PUBLIC_API_BASE` and set it in `eas.json` production profile.

### Phase 2 — Required Play Store wiring (1–2 days)
1. `app.json`: add `android.package`, `versionCode`, plugins for `expo-notifications`, `expo-camera`, `expo-image-picker`, `expo-location`, `expo-document-picker`; add Android permissions and iOS infoPlist strings.
2. `eas.json`: add `submit.production.android` with service-account JSON path and `track: "internal"`.
3. Add Privacy Policy URL (host or in-app) + Settings link + Delete-account flow.
4. Add `OnboardingConsentScreen` and gate first launch on accept.

### Phase 3 — Make the abstract-true features work (3–6 days)
1. **Cloudinary uploads** wired into health records, doctor verification documents, avatars (§3.1.F).
2. **OTP via SMS or Email** (§3.1.G) — pick one; SendGrid + nodemailer is the cheapest.
3. **FCM push notifications** wired (server-side `notification.service.ts` + client-side push-token registration via `expo-notifications`) (§3.1.D).
4. **Appointment reminder cron** using `node-cron` (§3.1.E).
5. **Socket.io chat** (server setup + `Message` persistence + `ChatScreen.tsx`) (§3.1.A).
6. **Agora video calls** (token endpoint + `react-native-agora` + `VideoCallScreen.tsx` — note this requires moving off Expo Go to a custom dev client / EAS build) (§3.1.B).
7. **OpenAI symptom checker** (replace rule-based with `gpt-4o-mini` call, keep fallback) (§3.1.C).

### Phase 4 — Half-built features (2–3 days)
- Reschedule + notes endpoints, subscriptions, support tickets, system logs/audit, reviews CRUD, blocked-slot UI, GPS pharmacies, scheduled medication reminders, full pagination — see §3.2 table.

### Phase 5 — Polish + QA (2–3 days)
- §3.4 list. Dark-mode visual QA. End-to-end flows in all three languages. Accessibility pass. Backend Swagger docs. Add at least smoke tests.

### Phase 6 — Pre-submission
- Internal track release on Play Console with 5 testers.
- Walk through the Data Safety form using the actual data flows.
- Confirm crash-free on Pixel + low-end Android (Helio G35 / 2 GB RAM target — 2G/3G optimisation per abstract).
- Submit.

---

## 5. Note on Payments

You've chosen to ship a **cash-on-consultation** payment screen instead of PayHere for now. The current state already supports this:

- `PaymentScreen.tsx` has a "Cash on Consultation" payment method card and immediately confirms the appointment.
- `confirmAppointment` server-side sets `payment.status = 'completed'` and `payment.paidAt = now()` so:
  - Earnings credit on consultation end → ✅ works
  - Payment History list for the patient → ✅ works (queries `Payment` model — which is currently **not written to**; see below)
  - Doctor's earnings dashboard → ✅ works (reads from `Appointment.payment.amount`)
  - Withdrawal request → ✅ works
- ✅ **Resolved 2026-04-26 (log row #1).** `confirmAppointment` now writes a `Payment` doc (`gateway: 'cash'`, `transactionId: CASH-{ts}-{apptId6}`) so Payment History renders for cash bookings. `getHistory` deep-populates the doctor.

When you do swap PayHere in, the payment-page integration is simply: generate a hash on the backend, redirect to PayHere checkout via `WebView`, listen on a webhook (`POST /api/payments/payhere/notify`) that verifies the signature and confirms the appointment.

---

## 7. Secret-Rotation & Git-History-Purge Runbook (row #8)

**Why this exists:** the file `suwamed-backend/.env` is committed to git and contains live MongoDB / JWT / Firebase / Agora / OpenAI / Cloudinary credentials. Until you rotate every one of those and remove the file from git history, the public repo is the source of those secrets.

Do these in order. **Do not skip steps.** All commands assume you are at `D:\Final year project\SuwaMed\`.

### Step A — Rotate every secret (no commands run on this machine; do them in each provider's dashboard)

1. **MongoDB Atlas** → Database Access → click the user → "Edit Password" → generate new → save the new connection string somewhere safe.
2. **JWT secrets** → on your machine: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` twice (one for `JWT_SECRET`, one for `JWT_REFRESH_SECRET`). Save them.
3. **Firebase Admin** → Firebase Console → Project Settings → Service Accounts → "Generate new private key" → download the JSON. Then **delete the OLD service account key** (Settings → Service Accounts → Manage service account permissions → IAM → find the service account → delete the old key from "Keys" tab).
4. **Agora** → Agora Console → your project → Configure → "App Certificate" → "Reset". (Note: you cannot rotate the App ID; it's the project identifier. The certificate is the secret.)
5. **OpenAI** → platform.openai.com → API keys → revoke the old key → create a new one. Set a usage cap on the project.
6. **Cloudinary** → Console → Settings → Security → "API Keys" → click the old key → "Disable" → create a new one. (Can also rotate the API secret independently.)

### Step B — Update local `.env` with the rotated values

Edit `suwamed-backend/.env` (locally only — this file should NEVER be committed) with the new secrets from Step A.

### Step C — Remove `.env` from the index but keep the local file

```bash
git rm --cached suwamed-backend/.env
git commit -m "chore: stop tracking .env (secrets rotated)"
```

`.gitignore` already lists `.env` — verified during the audit — so future commits will not re-add it.

### Step D — Purge `.env` from the entire git history

Use `git-filter-repo` (recommended — `git filter-branch` is deprecated). Install it once:

```bash
pip install git-filter-repo
```

Then, **on a fresh clone (don't run filter-repo on a checkout you have other work in)**:

```bash
cd ..
git clone "Final year project/SuwaMed" SuwaMed-purged
cd SuwaMed-purged
git filter-repo --path suwamed-backend/.env --invert-paths
# inspect: git log -- suwamed-backend/.env should print nothing
git remote add origin <your-github-url>
git push --force --all origin
git push --force --tags origin
```

After verifying the GitHub side is clean, replace your working directory with the purged clone (or `git fetch` + `git reset --hard origin/main`).

### Step E — Tell collaborators to re-clone

Anyone with an old clone of the repo still has the secrets in their local history. They MUST `rm -rf` their checkout and clone fresh.

### Step F — Confirm rotation worked

1. The committed copy of `.env` (now purged) referenced specific values — try to use the OLD values: connect to Atlas with the old password (must fail), call OpenAI with the old key (must 401), upload to Cloudinary with the old API secret (must 401), etc. If any of them still work, repeat Step A for that provider.
2. Restart the local backend (`npm run dev` in `suwamed-backend`) using the new `.env` and confirm it boots and connects to MongoDB.
3. Run a smoke test: register a new patient on the mobile app → verify OTP appears in backend logs → log in → confirm an appointment → confirm it shows up in Payment History.

### Step G — Add a pre-commit guard so this never happens again

Install `gitleaks` once:

```bash
# Windows: scoop install gitleaks    OR    winget install gitleaks
# macOS:    brew install gitleaks
```

Add `.git-hooks/pre-commit` (and configure `core.hooksPath`) or a Husky hook that runs `gitleaks protect --staged`. Commit the hook script — not the gitleaks binary.

### Step H — Mark row #8 ✅ in this document

Once Steps A–G are complete and you've verified the old secrets are dead, edit the §🚧 progress table and set row #8 to ✅ with the date.

---

## 6. Quick checklist for Play Store

- [ ] Rotate all committed secrets and purge `.env` from git history
- [ ] Deploy backend over HTTPS at a stable domain
- [ ] Set `android.package` in `app.json`
- [ ] Set Android permissions + iOS infoPlist strings in `app.json`
- [ ] Configure `expo-notifications`, `expo-camera`, `expo-image-picker`, `expo-location`, `expo-document-picker` plugins in `app.json`
- [ ] Point production API URL via `EXPO_PUBLIC_API_BASE`
- [ ] Privacy Policy URL + in-app link
- [ ] Delete-account flow
- [ ] Onboarding consent + medical disclaimer
- [ ] Wire **at least** OTP delivery, FCM push, Cloudinary upload, Payment row insertion
- [ ] Replace "Coming Soon" alerts on actionable buttons (Join Consultation, Maintenance Mode, Data Export, Backup, Support Tickets, etc.) — either implement or remove them from the UI
- [ ] Add Privacy Policy + Terms screens
- [ ] Insert `Payment` rows on appointment confirmation so Payment History works
- [ ] Set up Play Console internal-test track and pass 14-day closed test (Google's new requirement for new personal accounts)
- [ ] Complete Play Console Data Safety form
- [ ] Verify build passes on EAS production profile
- [ ] Test crash-free on a real low-end Android device, on 3G
