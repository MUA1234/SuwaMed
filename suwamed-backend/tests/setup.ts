// Test environment setup — runs before every test file.
//
// We deliberately do NOT spin up a real Mongo here. The smoke tests below
// exercise routes that can run without a DB connection (the 404 handler and
// the unauthenticated guard on protected routes). Add `mongodb-memory-server`
// in a follow-up if you want end-to-end auth lifecycle tests.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-prod';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-do-not-use-in-prod';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
// Keep the reminder cron quiet during tests.
process.env.ENABLE_REMINDERS = 'false';
// Stop firebase-admin from trying to initialise with bad creds.
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';
process.env.FIREBASE_CLIENT_EMAIL =
  process.env.FIREBASE_CLIENT_EMAIL || 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY =
  process.env.FIREBASE_PRIVATE_KEY ||
  '-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n';
