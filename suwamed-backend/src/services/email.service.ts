import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';

// Build a single transporter once at boot. Three providers are supported, picked
// in this order:
//   1. SendGrid (SENDGRID_API_KEY) — preferred for production: free 100/day tier,
//      no DKIM/SPF wrangling required, can be swapped for an account upgrade later.
//   2. Generic SMTP (SMTP_HOST + SMTP_USER + SMTP_PASS) — for self-hosted SMTP,
//      Mailtrap-in-staging, or providers like Mailgun/Postmark.
//   3. None — `transporter` stays null and every send becomes a dev-only log.
//
// We intentionally don't crash the app when no provider is configured. Logging
// the OTP keeps developer onboarding painless, and prod environments should set
// the env vars in the host's secret store.

const FROM = process.env.FROM_EMAIL || 'noreply@suwamed.lk';
const FROM_NAME = process.env.FROM_NAME || 'SuwaMed';
const FROM_HEADER = `${FROM_NAME} <${FROM}>`;

let transporter: Transporter | null = null;

if (process.env.SENDGRID_API_KEY) {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
  logger.info('[email] Using SendGrid SMTP transport');
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  logger.info(`[email] Using generic SMTP transport via ${process.env.SMTP_HOST}`);
} else {
  logger.warn('[email] No email provider configured — OTP emails will be logged to console only');
}

export const EMAIL_ENABLED = transporter !== null;

const otpTemplate = (otp: string, purpose: string, validMinutes = 5) => {
  const safeOtp = String(otp).replace(/[^0-9]/g, '');
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #2563EB; margin: 0; font-size: 24px;">SuwaMed</h1>
        <p style="color: #64748B; margin: 4px 0 0; font-size: 13px;">Care You Need, At Your Speed</p>
      </div>
      <h2 style="color: #0F172A; font-size: 18px; margin: 0 0 12px;">${purpose}</h2>
      <p style="color: #475569; line-height: 1.55; margin: 0 0 24px;">
        Use the code below to complete your request. It expires in ${validMinutes} minutes.
      </p>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; text-align: center; letter-spacing: 6px; font-size: 28px; font-weight: 700; color: #2563EB; margin-bottom: 24px;">
        ${safeOtp}
      </div>
      <p style="color: #94A3B8; font-size: 12px; line-height: 1.55; margin: 0;">
        If you didn't request this code, you can safely ignore this email — your account is still secure.
      </p>
    </div>
  `;
  const text = `${purpose}\n\nYour SuwaMed code: ${safeOtp}\nThis code expires in ${validMinutes} minutes.\n\nIf you didn't request this, you can ignore this email.`;
  return { html, text };
};

export const sendOtpEmail = async (
  to: string,
  otp: string,
  purpose = 'Verify your phone number',
): Promise<void> => {
  if (!transporter) {
    logger.info(`[email:dev] would send OTP "${otp}" to ${to} (${purpose})`);
    return;
  }
  const { html, text } = otpTemplate(otp, purpose);
  try {
    await transporter.sendMail({
      from: FROM_HEADER,
      to,
      subject: `${purpose} — SuwaMed`,
      html,
      text,
    });
    logger.info(`[email] OTP sent to ${to} (${purpose})`);
  } catch (err: any) {
    // Don't throw — falling through to a logged OTP is better than blocking
    // the whole register/login flow on a transient SMTP outage.
    logger.error(`[email] Failed to send OTP to ${to}: ${err?.message || err}`);
  }
};

export const sendPasswordResetEmail = async (to: string, otp: string): Promise<void> => {
  return sendOtpEmail(to, otp, 'Reset your SuwaMed password');
};
