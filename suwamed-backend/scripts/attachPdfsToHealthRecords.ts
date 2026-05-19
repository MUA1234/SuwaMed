import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import HealthRecord from '../src/models/HealthRecord.model';
import Prescription from '../src/models/Prescription.model';
import User from '../src/models/User.model';
import Doctor from '../src/models/Doctor.model';

// Map a HealthRecord ("Prescription - Dr. X") to the corresponding Prescription doc
// by matching the doctor's last name in the HealthRecord.doctor field.
const findPrescriptionForRecord = async (record: any): Promise<any | null> => {
  if (record.category !== 'prescription') return null;
  // Extract doctor name from the record (e.g. "Dr. Chamara Wickramasinghe" or "Dr. Priyanka Gunawardena")
  const m = /Dr\.\s+(\w+)/i.exec(record.doctor || record.title || '');
  if (!m) return null;
  const firstName = m[1];

  const doctorUser = await User.findOne({ firstName, role: 'doctor' }).lean();
  if (!doctorUser) return null;

  const doctorProfile = await Doctor.findOne({ userId: doctorUser._id }).lean();
  if (!doctorProfile) return null;

  // Get all prescriptions from this doctor for this patient, pick the closest by date.
  const candidates = await Prescription.find({
    doctorId: doctorProfile._id,
    patientId: record.patientId,
    pdfUrl: { $exists: true, $ne: null },
  }).lean();
  if (!candidates.length) return null;

  // Prefer the one whose issuedAt / createdAt is closest to record.date
  const recordTime = record.date ? new Date(record.date).getTime() : 0;
  let best: any = candidates[0];
  let bestDelta = Infinity;
  for (const c of candidates) {
    const t = new Date(c.issuedAt || c.createdAt || 0).getTime();
    const delta = Math.abs(t - recordTime);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = c;
    }
  }
  return best;
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to MongoDB (db: ${mongoose.connection.name})`);

  const kumari = await User.findOne({ email: 'kumari@suwamed.lk' }).lean();
  if (!kumari) throw new Error('Kumari not found');

  const records = await HealthRecord.find({
    patientId: kumari._id,
    category: 'prescription',
  });
  console.log(`Found ${records.length} prescription-category health records for Kumari`);

  for (const rec of records) {
    const presc = await findPrescriptionForRecord(rec);
    if (!presc) {
      console.log(`  ⚠ no matching prescription for record "${rec.title}" (${rec._id})`);
      continue;
    }

    await HealthRecord.findByIdAndUpdate(rec._id, {
      fileUrl: presc.pdfUrl,
      fileType: 'application/pdf',
      // Cloudinary doesn't report size on raw delivery URLs reliably; leave as-is or zero
    });
    console.log(`  ✓ "${rec.title}" → ${presc.pdfUrl.slice(0, 90)}...`);
  }

  console.log('\n✅ Done');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
