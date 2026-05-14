import cron, { ScheduledTask } from 'node-cron';
import Appointment from '../models/Appointment.model';
import Doctor from '../models/Doctor.model';
import User from '../models/User.model';
import logger from '../utils/logger';
import { sendToUser } from './notification.service';

// Combine a YYYY-MM-DD `date` field with a "HH:MM" `startTime` into a single
// Date instance. The schema stores `date` as a Date already (often midnight)
// and `startTime` as a "HH:MM" string, so we have to slot the time in.
function buildAppointmentMoment(date: Date, startTime: string): Date {
  const [h, m] = startTime.split(':').map((x) => parseInt(x, 10));
  const dt = new Date(date);
  if (!isNaN(h)) dt.setHours(h);
  if (!isNaN(m)) dt.setMinutes(m);
  dt.setSeconds(0);
  dt.setMilliseconds(0);
  return dt;
}

interface ReminderJob {
  flag: 'reminder24hSent' | 'reminder1hSent';
  /** Lower bound (ms from now) the appointment must be in to qualify. */
  windowMinMs: number;
  /** Upper bound (ms from now) the appointment must be in to qualify. */
  windowMaxMs: number;
  /** Title/body builders for the user-facing notification. */
  title: string;
  body(name: string, time: string): string;
  label: '24h' | '1h';
}

const JOBS: ReminderJob[] = [
  {
    flag: 'reminder24hSent',
    label: '24h',
    // Allow some slack on either side so a single hourly tick can still pick
    // appointments that landed mid-hour. We never re-send because the flag is
    // set on the document after each successful send.
    windowMinMs: 23 * 60 * 60 * 1000,
    windowMaxMs: 25 * 60 * 60 * 1000,
    title: 'Appointment tomorrow',
    body: (name, time) => `Reminder: your consultation with ${name} is at ${time} tomorrow.`,
  },
  {
    flag: 'reminder1hSent',
    label: '1h',
    windowMinMs: 55 * 60 * 1000,
    windowMaxMs: 65 * 60 * 1000,
    title: 'Appointment in 1 hour',
    body: (name, time) =>
      `Your consultation with ${name} starts at ${time}. Please be ready 5 minutes before.`,
  },
];

async function runJob(job: ReminderJob): Promise<void> {
  const now = Date.now();
  // Date filter is intentionally generous (today/tomorrow window) — we
  // re-check the moment in JS so we can use `startTime` for accuracy.
  const dateLowerBound = new Date(now);
  const dateUpperBound = new Date(now + job.windowMaxMs + 24 * 60 * 60 * 1000);

  const filter: Record<string, unknown> = {
    status: 'confirmed',
    date: { $gte: dateLowerBound, $lte: dateUpperBound },
    [job.flag]: { $ne: true },
  };

  const candidates = await Appointment.find(filter)
    .populate({
      path: 'doctorId',
      select: 'userId',
      populate: { path: 'userId', select: 'firstName lastName' },
    })
    .lean();

  let sent = 0;
  for (const appt of candidates) {
    const moment = buildAppointmentMoment(appt.date as Date, appt.startTime);
    const deltaMs = moment.getTime() - now;
    if (deltaMs < job.windowMinMs || deltaMs > job.windowMaxMs) continue;

    const doctor = appt.doctorId as unknown as {
      userId?: { _id: unknown; firstName?: string; lastName?: string };
    } | null;
    const doctorUser = doctor?.userId;
    const doctorName = doctorUser
      ? `Dr. ${doctorUser.firstName ?? ''} ${doctorUser.lastName ?? ''}`.trim()
      : 'your doctor';

    // Patient's name (for the doctor-side notification).
    let patientName = 'your patient';
    try {
      const p = await User.findById(appt.patientId).select('firstName lastName').lean();
      if (p) patientName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || patientName;
    } catch {
      /* non-fatal */
    }

    const data = {
      appointmentId: String(appt._id),
      type: appt.type,
      startTime: appt.startTime,
      date: (appt.date as Date).toISOString(),
      reminder: job.label,
    };

    // Patient-side notification.
    await sendToUser({
      userId: appt.patientId as unknown as string,
      type: 'appointment_reminder',
      title: job.title,
      body: job.body(doctorName, appt.startTime),
      data,
    });

    // Doctor-side notification — only if we resolved a User _id.
    if (doctorUser?._id) {
      await sendToUser({
        userId: doctorUser._id as unknown as string,
        type: 'appointment_reminder',
        title: job.title,
        body: job.body(patientName, appt.startTime),
        data,
      });
    }

    await Appointment.updateOne({ _id: appt._id }, { $set: { [job.flag]: true } });
    sent += 1;
  }

  if (sent > 0) {
    logger.info(`[reminder] ${job.label} job sent ${sent} reminder(s)`);
  }
}

const tasks: ScheduledTask[] = [];

export function startReminderJobs(): void {
  if (process.env.ENABLE_REMINDERS !== 'true') {
    logger.info('[reminder] ENABLE_REMINDERS!=true — appointment reminder cron not started');
    return;
  }

  // 24-hour reminder check runs at minute 0 of every hour.
  const job24 = cron.schedule(
    '0 * * * *',
    () => {
      runJob(JOBS[0]).catch((err) => logger.error(`[reminder] 24h job failed: ${err.message}`));
    },
    { timezone: process.env.CRON_TIMEZONE || 'Asia/Colombo' },
  );

  // 1-hour reminder check runs every 5 minutes.
  const job1 = cron.schedule(
    '*/5 * * * *',
    () => {
      runJob(JOBS[1]).catch((err) => logger.error(`[reminder] 1h job failed: ${err.message}`));
    },
    { timezone: process.env.CRON_TIMEZONE || 'Asia/Colombo' },
  );

  tasks.push(job24, job1);

  // Run once immediately at boot so we don't have to wait up to an hour for
  // the first 24h check on a freshly deployed instance.
  runJob(JOBS[0]).catch((err) => logger.error(`[reminder] boot 24h sweep failed: ${err.message}`));
  runJob(JOBS[1]).catch((err) => logger.error(`[reminder] boot 1h sweep failed: ${err.message}`));

  logger.info('[reminder] appointment reminder cron started (24h hourly, 1h every 5 min)');
}

export function stopReminderJobs(): void {
  for (const t of tasks) t.stop();
  tasks.length = 0;
}
