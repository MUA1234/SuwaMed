import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import dns from 'dns';
import PDFDocument from 'pdfkit';

import Prescription from '../src/models/Prescription.model';
import Doctor from '../src/models/Doctor.model';
import User from '../src/models/User.model';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Same renderer as scripts/generatePrescriptionPdfs.ts — kept inline to avoid a
// circular dep and so this script remains a self-contained one-shot.
type Data = {
  _id: any;
  diagnosis?: string;
  medications: Array<{ name?: string; dosage?: string; frequency?: string; duration?: string; instructions?: string; quantity?: number }>;
  additionalNotes?: string;
  followUpDate?: Date | null;
  followUpInstructions?: string;
  issuedAt?: Date | null;
  createdAt?: Date | null;
  doctor?: { firstName?: string; lastName?: string };
  doctorProfile?: { slmcRegistrationNo?: string; specialization?: string[]; hospital?: string };
  patient?: { firstName?: string; lastName?: string };
};

const renderPdfToBuffer = (data: Data): Promise<Buffer> => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const PRIMARY = '#1A73E8';
  const TEXT = '#1F2937';
  const MUTED = '#6B7280';
  const ACCENT = '#E6F4FE';

  doc.rect(0, 0, doc.page.width, 110).fill(PRIMARY);
  doc.fillColor('#fff').fontSize(26).font('Helvetica-Bold').text('SuwaMed', 50, 40);
  doc.fontSize(11).font('Helvetica').text('Care You Need, At Your Speed', 50, 72);
  doc.fontSize(10).text('Digital Medical Prescription', 50, 88);
  doc.fontSize(48).font('Helvetica-Bold').fillColor('#fff').opacity(0.25).text('Rx', doc.page.width - 110, 40, { width: 60 });
  doc.opacity(1);

  let y = 140;
  const cardW = (doc.page.width - 100 - 20) / 2;

  const drawCard = (x: number, title: string, lines: Array<[string, string]>) => {
    const cardH = 30 + lines.length * 18 + 12;
    doc.roundedRect(x, y, cardW, cardH, 8).fillAndStroke(ACCENT, '#D1E4FA');
    doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold').text(title.toUpperCase(), x + 14, y + 12);
    let ly = y + 30;
    for (const [k, v] of lines) {
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(k.toUpperCase(), x + 14, ly);
      doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(v || '—', x + 14, ly + 7, { width: cardW - 28 });
      ly += 18;
    }
    return cardH;
  };

  const doctorName = data.doctor ? `Dr. ${data.doctor.firstName ?? ''} ${data.doctor.lastName ?? ''}`.trim() : 'Unknown Doctor';
  const patientName = data.patient ? `${data.patient.firstName ?? ''} ${data.patient.lastName ?? ''}`.trim() : 'Unknown Patient';
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

  if (data.diagnosis) {
    doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text('DIAGNOSIS', 50, y);
    y += 16;
    doc.fillColor(TEXT).fontSize(12).font('Helvetica').text(data.diagnosis, 50, y, { width: doc.page.width - 100 });
    y = doc.y + 14;
  }

  doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text(`MEDICATIONS  (${data.medications.length})`, 50, y);
  y += 18;

  data.medications.forEach((med, idx) => {
    const cardX = 50;
    const cardWi = doc.page.width - 100;
    const startY = y;
    doc.fillColor(TEXT).fontSize(12).font('Helvetica-Bold').text(`${idx + 1}.  ${med.name || 'Unnamed medication'}`, cardX + 12, startY + 10);
    let my = startY + 32;
    const cols: Array<[string, string]> = [];
    if (med.dosage) cols.push(['Dosage', med.dosage]);
    if (med.frequency) cols.push(['Frequency', med.frequency]);
    if (med.duration) cols.push(['Duration', med.duration]);
    if (med.quantity) cols.push(['Quantity', String(med.quantity)]);
    if (cols.length) {
      const colW = (cardWi - 24) / Math.min(cols.length, 4);
      cols.slice(0, 4).forEach(([k, v], i) => {
        doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(k.toUpperCase(), cardX + 12 + i * colW, my);
        doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(v, cardX + 12 + i * colW, my + 10, { width: colW - 8 });
      });
      my += 32;
    }
    if (med.instructions) {
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text('INSTRUCTIONS', cardX + 12, my);
      my += 10;
      doc.fillColor(TEXT).fontSize(10).font('Helvetica-Oblique').text(med.instructions, cardX + 12, my, { width: cardWi - 24 });
      my = doc.y + 8;
    }
    const cardH = my - startY + 4;
    doc.roundedRect(cardX, startY, cardWi, cardH, 8).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.rect(cardX, startY, 3, cardH).fill(PRIMARY);
    y = startY + cardH + 10;
    if (y > doc.page.height - 180) { doc.addPage(); y = 50; }
  });

  if (data.additionalNotes) {
    y += 6;
    doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text('ADDITIONAL NOTES', 50, y);
    y += 16;
    doc.fillColor(TEXT).fontSize(10).font('Helvetica').text(data.additionalNotes, 50, y, { width: doc.page.width - 100 });
    y = doc.y + 14;
  }

  if (data.followUpDate || data.followUpInstructions) {
    const followUpDate = data.followUpDate ? new Date(data.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    doc.roundedRect(50, y, doc.page.width - 100, 60, 8).fillAndStroke('#FFF8E1', '#FCD34D');
    doc.fillColor('#92400E').fontSize(10).font('Helvetica-Bold').text('FOLLOW-UP', 64, y + 12);
    if (followUpDate) doc.fillColor(TEXT).fontSize(11).font('Helvetica').text(`Date: ${followUpDate}`, 64, y + 28);
    if (data.followUpInstructions) doc.fillColor(TEXT).fontSize(10).text(data.followUpInstructions, 64, y + (followUpDate ? 44 : 28), { width: doc.page.width - 128 });
    y += 76;
  }

  const footerY = doc.page.height - 80;
  doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#E5E7EB').lineWidth(1).stroke();
  doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold').text(doctorName, 50, footerY + 10);
  doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(`SLMC ${slmc}  ·  ${spec}`, 50, footerY + 24);
  doc.fillColor(MUTED).fontSize(8).font('Helvetica-Oblique').text('This prescription is digitally issued by SuwaMed and is valid as a medical document.', 50, footerY + 44, { width: doc.page.width - 100, align: 'center' });

  doc.end();
});

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const kumari = await User.findOne({ email: 'kumari@suwamed.lk' }).lean();
  if (!kumari) throw new Error('Kumari not found');

  // The "Essential Hypertension" prescription by Dr. Chamara is the showcase one
  const presc = await Prescription.findOne({ patientId: kumari._id, diagnosis: 'Essential Hypertension' }).lean();
  if (!presc) throw new Error('Essential Hypertension prescription not found');

  const doctorProfile = await Doctor.findById(presc.doctorId).lean();
  const doctorUser = doctorProfile ? await User.findById((doctorProfile as any).userId).select('firstName lastName').lean() : null;

  const data: Data = {
    _id: presc._id,
    diagnosis: presc.diagnosis,
    medications: presc.medications as any,
    additionalNotes: presc.additionalNotes,
    followUpDate: presc.followUpDate,
    followUpInstructions: presc.followUpInstructions,
    issuedAt: presc.issuedAt,
    createdAt: (presc as any).createdAt,
    doctor: doctorUser ? { firstName: (doctorUser as any).firstName, lastName: (doctorUser as any).lastName } : undefined,
    doctorProfile: doctorProfile ? { slmcRegistrationNo: (doctorProfile as any).slmcRegistrationNo, specialization: (doctorProfile as any).specialization, hospital: (doctorProfile as any).hospital } : undefined,
    patient: { firstName: (kumari as any).firstName, lastName: (kumari as any).lastName },
  };

  const buf = await renderPdfToBuffer(data);
  const outDir = path.resolve(__dirname, '../../suwamed-mobile/assets/prescriptions');
  const outFile = path.join(outDir, 'dr-chamara-essential-hypertension.pdf');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, buf);
  console.log(`✅ Wrote ${buf.length} bytes to ${outFile}`);

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
