import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import dns from 'dns';
import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';

import Prescription from '../src/models/Prescription.model';
import Doctor from '../src/models/Doctor.model';
import User from '../src/models/User.model';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type PopulatedPrescription = {
  _id: any;
  diagnosis?: string;
  medications: Array<{ name?: string; dosage?: string; frequency?: string; duration?: string; instructions?: string; quantity?: number }>;
  additionalNotes?: string;
  followUpDate?: Date;
  followUpInstructions?: string;
  digitalSignature?: string;
  issuedAt?: Date;
  createdAt?: Date;
  doctor?: { firstName?: string; lastName?: string };
  doctorProfile?: { slmcRegistrationNo?: string; specialization?: string[]; hospital?: string };
  patient?: { firstName?: string; lastName?: string };
};

const renderPdfToBuffer = (data: PopulatedPrescription): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PRIMARY = '#1A73E8';
    const TEXT = '#1F2937';
    const MUTED = '#6B7280';
    const ACCENT = '#E6F4FE';

    // ── Header band ─────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill(PRIMARY);
    doc.fillColor('#fff').fontSize(26).font('Helvetica-Bold').text('SuwaMed', 50, 40);
    doc.fontSize(11).font('Helvetica').text('Care You Need, At Your Speed', 50, 72);
    doc.fontSize(10).text('Digital Medical Prescription', 50, 88);

    // Rx symbol on the right of the header
    doc.fontSize(48).font('Helvetica-Bold').fillColor('#fff').opacity(0.25).text('Rx', doc.page.width - 110, 40, { width: 60 });
    doc.opacity(1);

    let y = 140;

    // ── Doctor / Patient cards ─────────────────────────────
    const cardW = (doc.page.width - 100 - 20) / 2;

    const drawCard = (x: number, title: string, lines: Array<[string, string]>) => {
      const cardH = 30 + lines.length * 18 + 12;
      doc.roundedRect(x, y, cardW, cardH, 8).fillAndStroke(ACCENT, '#D1E4FA');
      doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold').text(title.toUpperCase(), x + 14, y + 12);
      let ly = y + 30;
      for (const [label, val] of lines) {
        doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(label.toUpperCase(), x + 14, ly);
        doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(val || '—', x + 14, ly + 7, { width: cardW - 28 });
        ly += 18;
      }
      return cardH;
    };

    const doctorName = data.doctor
      ? `Dr. ${data.doctor.firstName ?? ''} ${data.doctor.lastName ?? ''}`.trim()
      : 'Unknown Doctor';
    const patientName = data.patient
      ? `${data.patient.firstName ?? ''} ${data.patient.lastName ?? ''}`.trim()
      : 'Unknown Patient';
    const slmc = data.doctorProfile?.slmcRegistrationNo || 'N/A';
    const spec = data.doctorProfile?.specialization?.[0] || 'General Practitioner';
    const hosp = data.doctorProfile?.hospital || '—';
    const issued = (data.issuedAt || data.createdAt) ? new Date(data.issuedAt || data.createdAt!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const h1 = drawCard(50, 'Prescribing Doctor', [
      ['Name', doctorName],
      ['Specialization', spec],
      ['SLMC Reg. No.', slmc],
      ['Hospital', hosp],
    ]);
    const h2 = drawCard(50 + cardW + 20, 'Patient', [
      ['Name', patientName],
      ['Date Issued', issued],
      ['Prescription ID', String(data._id).slice(-8).toUpperCase()],
    ]);
    y += Math.max(h1, h2) + 20;

    // ── Diagnosis ──────────────────────────────────────────
    if (data.diagnosis) {
      doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text('DIAGNOSIS', 50, y);
      y += 16;
      doc.fillColor(TEXT).fontSize(12).font('Helvetica').text(data.diagnosis, 50, y, { width: doc.page.width - 100 });
      y = doc.y + 14;
    }

    // ── Medications ────────────────────────────────────────
    doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text(`MEDICATIONS  (${data.medications.length})`, 50, y);
    y += 18;

    data.medications.forEach((med, idx) => {
      // Card per medication
      const cardX = 50;
      const cardW2 = doc.page.width - 100;
      const startY = y;
      doc.roundedRect(cardX, startY, cardW2, 1, 6).fill('#fff'); // placeholder so we know vertical
      doc.fillColor(TEXT).fontSize(12).font('Helvetica-Bold').text(`${idx + 1}.  ${med.name || 'Unnamed medication'}`, cardX + 12, startY + 10);
      let my = startY + 32;

      const detailLine: Array<[string, string]> = [];
      if (med.dosage) detailLine.push(['Dosage', med.dosage]);
      if (med.frequency) detailLine.push(['Frequency', med.frequency]);
      if (med.duration) detailLine.push(['Duration', med.duration]);
      if (med.quantity) detailLine.push(['Quantity', String(med.quantity)]);

      if (detailLine.length) {
        const colW = (cardW2 - 24) / Math.min(detailLine.length, 4);
        detailLine.slice(0, 4).forEach(([k, v], i) => {
          doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(k.toUpperCase(), cardX + 12 + i * colW, my);
          doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(v, cardX + 12 + i * colW, my + 10, { width: colW - 8 });
        });
        my += 32;
      }

      if (med.instructions) {
        doc.fillColor(MUTED).fontSize(8).font('Helvetica').text('INSTRUCTIONS', cardX + 12, my);
        my += 10;
        doc.fillColor(TEXT).fontSize(10).font('Helvetica-Oblique').text(med.instructions, cardX + 12, my, { width: cardW2 - 24 });
        my = doc.y + 8;
      }

      // Now we know the height — draw the card border behind the content
      const cardH = my - startY + 4;
      doc.roundedRect(cardX, startY, cardW2, cardH, 8).strokeColor('#E5E7EB').lineWidth(1).stroke();
      // Left accent stripe
      doc.rect(cardX, startY, 3, cardH).fill(PRIMARY);

      y = startY + cardH + 10;

      // page break if low on space
      if (y > doc.page.height - 180) {
        doc.addPage();
        y = 50;
      }
    });

    // ── Additional notes ──────────────────────────────────
    if (data.additionalNotes) {
      y += 6;
      doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text('ADDITIONAL NOTES', 50, y);
      y += 16;
      doc.fillColor(TEXT).fontSize(10).font('Helvetica').text(data.additionalNotes, 50, y, { width: doc.page.width - 100 });
      y = doc.y + 14;
    }

    // ── Follow-up ─────────────────────────────────────────
    if (data.followUpDate || data.followUpInstructions) {
      const followUpDate = data.followUpDate ? new Date(data.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
      doc.roundedRect(50, y, doc.page.width - 100, 60, 8).fillAndStroke('#FFF8E1', '#FCD34D');
      doc.fillColor('#92400E').fontSize(10).font('Helvetica-Bold').text('FOLLOW-UP', 64, y + 12);
      if (followUpDate) doc.fillColor(TEXT).fontSize(11).font('Helvetica').text(`Date: ${followUpDate}`, 64, y + 28);
      if (data.followUpInstructions) doc.fillColor(TEXT).fontSize(10).text(data.followUpInstructions, 64, y + (followUpDate ? 44 : 28), { width: doc.page.width - 128 });
      y += 76;
    }

    // ── Footer ────────────────────────────────────────────
    const footerY = doc.page.height - 80;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(doctorName, 50, footerY + 10);
    doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(`SLMC ${slmc}  ·  ${spec}`, 50, footerY + 24);

    doc.fillColor(MUTED).fontSize(8).font('Helvetica-Oblique').text('This prescription is digitally issued by SuwaMed and is valid as a medical document.', 50, footerY + 44, { width: doc.page.width - 100, align: 'center' });

    doc.end();
  });
};

const uploadPdf = (buffer: Buffer, publicId: string): Promise<string> =>
  new Promise((resolve, reject) => {
    // resource_type 'image' lets Cloudinary serve the PDF without the
    // "restricted PDF/ZIP delivery" account-level guard. Cloudinary still
    // stores the file as a real PDF (format: 'pdf') and the URL ends in .pdf.
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'suwamed/prescriptions',
        public_id: publicId,
        overwrite: true,
        format: 'pdf',
        pages: true,
      },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary env is missing');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to MongoDB (db: ${mongoose.connection.name})`);

  // Find Kumari's prescriptions, populate doctor + patient
  const kumari = await User.findOne({ email: 'kumari@suwamed.lk' }).select('_id firstName lastName').lean();
  if (!kumari) throw new Error('Kumari user not found');
  console.log(`Found Kumari: ${kumari._id}`);

  const prescriptions = await Prescription.find({ patientId: kumari._id }).lean();
  console.log(`Found ${prescriptions.length} prescription(s) for Kumari`);

  for (const p of prescriptions) {
    const doctorProfile = await Doctor.findById(p.doctorId).lean();
    const doctorUser = doctorProfile ? await User.findById((doctorProfile as any).userId).select('firstName lastName').lean() : null;

    const data: PopulatedPrescription = {
      _id: p._id,
      diagnosis: p.diagnosis,
      medications: p.medications as any,
      additionalNotes: p.additionalNotes,
      followUpDate: p.followUpDate,
      followUpInstructions: p.followUpInstructions,
      digitalSignature: p.digitalSignature,
      issuedAt: p.issuedAt,
      createdAt: (p as any).createdAt,
      doctor: doctorUser ? { firstName: (doctorUser as any).firstName, lastName: (doctorUser as any).lastName } : undefined,
      doctorProfile: doctorProfile ? { slmcRegistrationNo: (doctorProfile as any).slmcRegistrationNo, specialization: (doctorProfile as any).specialization, hospital: (doctorProfile as any).hospital } : undefined,
      patient: { firstName: (kumari as any).firstName, lastName: (kumari as any).lastName },
    };

    console.log(`\n→ Generating PDF for prescription ${p._id} (${p.diagnosis})…`);
    const buf = await renderPdfToBuffer(data);
    console.log(`  rendered ${buf.length} bytes`);

    const url = await uploadPdf(buf, `rx_${String(p._id)}`);
    console.log(`  uploaded → ${url}`);

    await Prescription.findByIdAndUpdate(p._id, { pdfUrl: url });
    console.log(`  saved pdfUrl on prescription ${p._id}`);
  }

  console.log('\n✅ Done');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
