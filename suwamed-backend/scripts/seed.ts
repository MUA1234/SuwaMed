import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../src/config/database';
import User from '../src/models/User.model';
import Doctor from '../src/models/Doctor.model';
import Patient from '../src/models/Patient.model';
import Appointment from '../src/models/Appointment.model';
import HealthRecord from '../src/models/HealthRecord.model';
import HealthTip from '../src/models/HealthTip.model';
import Review from '../src/models/Review.model';
import Payment from '../src/models/Payment.model';
import SymptomCheck from '../src/models/SymptomCheck.model';
import Prescription from '../src/models/Prescription.model';
import Notification from '../src/models/Notification.model';

const hash = (pw: string) => bcrypt.hashSync(pw, 12);

const seed = async () => {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clear existing data
    await Promise.all([
        User.deleteMany({}),
        Doctor.deleteMany({}),
        Patient.deleteMany({}),
        Appointment.deleteMany({}),
        HealthRecord.deleteMany({}),
        HealthTip.deleteMany({}),
        Review.deleteMany({}),
        Payment.deleteMany({}),
        SymptomCheck.deleteMany({}),
        Prescription.deleteMany({}),
        Notification.deleteMany({}),
    ]);

    // ─── ADMIN USER ─────────────────────────────────────
    await User.insertMany([
        { email: 'admin@suwamed.lk', phone: '+94700000001', password: hash('Admin@123'), role: 'admin', firstName: 'Admin', lastName: 'SuwaMed', language: 'en', isPhoneVerified: true, isEmailVerified: true },
    ]);
    console.log('  ✓ Created admin user');
    console.log('  ✓ Cleared existing data');

    // ─── DOCTOR USERS ─────────────────────────────────
    const doctorUsers = await User.insertMany([
        { email: 'chamara@suwamed.lk', phone: '+94771234501', password: hash('Doctor@123'), role: 'doctor', firstName: 'Chamara', lastName: 'Wickramasinghe', gender: 'male', address: { district: 'Colombo' }, language: 'en', isPhoneVerified: true, isEmailVerified: true },
        { email: 'priyanka@suwamed.lk', phone: '+94771234502', password: hash('Doctor@123'), role: 'doctor', firstName: 'Priyanka', lastName: 'Gunawardena', gender: 'female', address: { district: 'Kandy' }, language: 'en', isPhoneVerified: true, isEmailVerified: true },
        { email: 'ruwan@suwamed.lk', phone: '+94771234503', password: hash('Doctor@123'), role: 'doctor', firstName: 'Ruwan', lastName: 'Jayasekera', gender: 'male', address: { district: 'Galle' }, language: 'si', isPhoneVerified: true, isEmailVerified: true },
        { email: 'lakshmi@suwamed.lk', phone: '+94771234504', password: hash('Doctor@123'), role: 'doctor', firstName: 'Lakshmi', lastName: 'Perera', gender: 'female', address: { district: 'Jaffna' }, language: 'ta', isPhoneVerified: true, isEmailVerified: true },
        { email: 'anura@suwamed.lk', phone: '+94771234505', password: hash('Doctor@123'), role: 'doctor', firstName: 'Anura', lastName: 'Dissanayake', gender: 'male', address: { district: 'Kurunegala' }, language: 'en', isPhoneVerified: true, isEmailVerified: true },
        { email: 'nimal.doc@suwamed.lk', phone: '+94771234506', password: hash('Doctor@123'), role: 'doctor', firstName: 'Nimal', lastName: 'Sirisena', gender: 'male', address: { district: 'Matara' }, language: 'si', isPhoneVerified: true, isEmailVerified: true },
        { email: 'sanduni@suwamed.lk', phone: '+94771234507', password: hash('Doctor@123'), role: 'doctor', firstName: 'Sanduni', lastName: 'Jayaweera', gender: 'female', address: { district: 'Gampaha' }, language: 'en', isPhoneVerified: true, isEmailVerified: true },
        { email: 'kamal@suwamed.lk', phone: '+94771234508', password: hash('Doctor@123'), role: 'doctor', firstName: 'Kamal', lastName: 'Bandara', gender: 'male', address: { district: 'Ratnapura' }, language: 'si', isPhoneVerified: true, isEmailVerified: true },
    ]);
    console.log(`  ✓ Created ${doctorUsers.length} doctor users`);

    // ─── DOCTOR PROFILES ────────────────────────────────
    const doctorProfiles = await Doctor.insertMany([
        { userId: doctorUsers[0]._id, slmcRegistrationNo: 'SLMC-2018-1234', specialization: ['General Practitioner'], experience: 8, bio: 'Experienced GP with 8 years of practice in community healthcare.', languages: ['en', 'si'], consultationFee: 2500, followUpFee: 1500, rating: { average: 4.8, count: 42 }, totalConsultations: 342, totalEarnings: 463000, pendingWithdrawal: 8500, verificationStatus: 'verified', hospital: 'Colombo General Hospital', isOnline: true, availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30, isActive: true }, { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDuration: 30, isActive: true }, { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDuration: 30, isActive: true }, { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDuration: 30, isActive: true }, { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true }] },
        { userId: doctorUsers[1]._id, slmcRegistrationNo: 'SLMC-2015-5678', specialization: ['Cardiologist'], experience: 12, bio: 'Senior consultant cardiologist specializing in interventional cardiology.', languages: ['en', 'si'], consultationFee: 3500, followUpFee: 2000, rating: { average: 4.9, count: 67 }, totalConsultations: 520, totalEarnings: 895000, pendingWithdrawal: 12000, verificationStatus: 'verified', hospital: 'Kandy Teaching Hospital', isOnline: true, availability: [{ dayOfWeek: 1, startTime: '10:00', endTime: '16:00', slotDuration: 30, isActive: true }, { dayOfWeek: 3, startTime: '10:00', endTime: '16:00', slotDuration: 30, isActive: true }, { dayOfWeek: 5, startTime: '10:00', endTime: '14:00', slotDuration: 30, isActive: true }] },
        { userId: doctorUsers[2]._id, slmcRegistrationNo: 'SLMC-2017-9012', specialization: ['Dermatologist'], experience: 6, bio: 'Dermatology specialist treating skin conditions including tropical skin diseases.', languages: ['en', 'si'], consultationFee: 3000, followUpFee: 1800, rating: { average: 4.6, count: 35 }, totalConsultations: 218, totalEarnings: 312000, pendingWithdrawal: 5000, verificationStatus: 'verified', hospital: 'Karapitiya Teaching Hospital', isOnline: false, availability: [{ dayOfWeek: 2, startTime: '09:00', endTime: '15:00', slotDuration: 30, isActive: true }, { dayOfWeek: 4, startTime: '09:00', endTime: '15:00', slotDuration: 30, isActive: true }] },
        { userId: doctorUsers[3]._id, slmcRegistrationNo: 'SLMC-2016-3456', specialization: ['Pediatrician'], experience: 10, bio: 'Dedicated pediatrician focused on child development and immunization.', languages: ['en', 'ta'], consultationFee: 2800, followUpFee: 1600, rating: { average: 4.7, count: 51 }, totalConsultations: 410, totalEarnings: 580000, pendingWithdrawal: 7500, verificationStatus: 'verified', hospital: 'Jaffna Teaching Hospital', isOnline: true, availability: [{ dayOfWeek: 1, startTime: '08:00', endTime: '14:00', slotDuration: 30, isActive: true }, { dayOfWeek: 3, startTime: '08:00', endTime: '14:00', slotDuration: 30, isActive: true }, { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', slotDuration: 30, isActive: true }] },
        { userId: doctorUsers[4]._id, slmcRegistrationNo: 'SLMC-2014-7890', specialization: ['Orthopedic Surgeon'], experience: 14, bio: 'Consultant orthopedic surgeon specializing in joint replacements.', languages: ['en', 'si'], consultationFee: 4000, followUpFee: 2500, rating: { average: 4.5, count: 28 }, totalConsultations: 180, totalEarnings: 420000, pendingWithdrawal: 15000, verificationStatus: 'verified', hospital: 'Kurunegala Teaching Hospital', isOnline: false, availability: [{ dayOfWeek: 2, startTime: '10:00', endTime: '16:00', slotDuration: 30, isActive: true }, { dayOfWeek: 4, startTime: '10:00', endTime: '16:00', slotDuration: 30, isActive: true }] },
        { userId: doctorUsers[5]._id, slmcRegistrationNo: 'SLMC-2019-2345', specialization: ['Neurologist'], experience: 5, bio: 'Neurologist treating migraines, epilepsy, and neurological disorders.', languages: ['en', 'si'], consultationFee: 3500, followUpFee: 2000, rating: { average: 4.4, count: 19 }, totalConsultations: 95, totalEarnings: 180000, pendingWithdrawal: 3000, verificationStatus: 'verified', hospital: 'Matara General Hospital', isOnline: true, availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '15:00', slotDuration: 30, isActive: true }, { dayOfWeek: 3, startTime: '09:00', endTime: '15:00', slotDuration: 30, isActive: true }] },
        { userId: doctorUsers[6]._id, slmcRegistrationNo: 'SLMC-2020-6789', specialization: ['Gynecologist'], experience: 4, bio: 'Obstetrician and gynecologist for women\'s reproductive health.', languages: ['en', 'si'], consultationFee: 3000, followUpFee: 1800, rating: { average: 4.7, count: 32 }, totalConsultations: 158, totalEarnings: 275000, pendingWithdrawal: 6000, verificationStatus: 'pending', hospital: 'Ragama Teaching Hospital', isOnline: true, availability: [{ dayOfWeek: 1, startTime: '08:00', endTime: '16:00', slotDuration: 30, isActive: true }, { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', slotDuration: 30, isActive: true }, { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', slotDuration: 30, isActive: true }] },
        { userId: doctorUsers[7]._id, slmcRegistrationNo: 'SLMC-2013-0123', specialization: ['Psychiatrist'], experience: 15, bio: 'Senior psychiatrist with expertise in anxiety, depression, and PTSD.', languages: ['en', 'si'], consultationFee: 3500, followUpFee: 2000, rating: { average: 4.8, count: 45 }, totalConsultations: 380, totalEarnings: 650000, pendingWithdrawal: 20000, verificationStatus: 'verified', hospital: 'Angoda Mental Health Institute', isOnline: false, availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDuration: 45, isActive: true }, { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDuration: 45, isActive: true }, { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDuration: 45, isActive: true }] },
    ]);
    console.log(`  ✓ Created ${doctorProfiles.length} doctor profiles`);

    // ─── PATIENT USERS ──────────────────────────────────
    const patientUsers = await User.insertMany([
        { email: 'kumari@suwamed.lk', phone: '+94769876501', password: hash('Patient@123'), role: 'patient', firstName: 'Kumari', lastName: 'Perera', gender: 'female', dateOfBirth: new Date('1992-05-14'), address: { district: 'Colombo' }, language: 'en', isPhoneVerified: true, isEmailVerified: true },
        { email: 'saman@gmail.com', phone: '+94769876502', password: hash('Patient@123'), role: 'patient', firstName: 'Saman', lastName: 'Fernando', gender: 'male', dateOfBirth: new Date('1981-09-22'), address: { district: 'Gampaha' }, language: 'si', isPhoneVerified: true },
        { email: 'nirmala@gmail.com', phone: '+94769876503', password: hash('Patient@123'), role: 'patient', firstName: 'Nirmala', lastName: 'Dias', gender: 'female', dateOfBirth: new Date('1998-01-30'), address: { district: 'Kandy' }, language: 'en', isPhoneVerified: true },
        { email: 'nimal@gmail.com', phone: '+94769876504', password: hash('Patient@123'), role: 'patient', firstName: 'Nimal', lastName: 'Jayawardena', gender: 'male', dateOfBirth: new Date('1974-11-08'), address: { district: 'Kurunegala' }, language: 'si', isPhoneVerified: true },
        { email: 'anoma@gmail.com', phone: '+94769876505', password: hash('Patient@123'), role: 'patient', firstName: 'Anoma', lastName: 'Silva', gender: 'female', dateOfBirth: new Date('1985-03-18'), address: { district: 'Galle' }, language: 'en', isPhoneVerified: true },
        { email: 'chaminda@gmail.com', phone: '+94769876506', password: hash('Patient@123'), role: 'patient', firstName: 'Chaminda', lastName: 'Rathnayake', gender: 'male', dateOfBirth: new Date('1966-07-25'), address: { district: 'Matara' }, language: 'si', isPhoneVerified: true },
    ]);
    console.log(`  ✓ Created ${patientUsers.length} patient users`);

    // ─── PATIENT PROFILES ───────────────────────────────
    const patientProfiles = await Patient.insertMany([
        { userId: patientUsers[0]._id, bloodGroup: 'O+', height: 162, weight: 58, allergies: [], chronicConditions: ['Hypertension'], emergencyContact: { name: 'Nimal Perera', phone: '+94771111111', relationship: 'Husband' }, subscription: { plan: 'premium', isActive: true, autoRenew: true, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') } },
        { userId: patientUsers[1]._id, bloodGroup: 'A+', height: 175, weight: 82, allergies: ['Penicillin'], chronicConditions: ['Diabetes (Type 2)'], emergencyContact: { name: 'Malini Fernando', phone: '+94772222222', relationship: 'Wife' }, subscription: { plan: 'basic', isActive: true, autoRenew: false } },
        { userId: patientUsers[2]._id, bloodGroup: 'B+', height: 158, weight: 52, allergies: [], chronicConditions: [], emergencyContact: { name: 'Sunil Dias', phone: '+94773333333', relationship: 'Father' }, subscription: { plan: 'free', isActive: true, autoRenew: false } },
        { userId: patientUsers[3]._id, bloodGroup: 'AB-', height: 170, weight: 78, allergies: ['Aspirin'], chronicConditions: ['Chronic Back Pain', 'Arthritis'], emergencyContact: { name: 'Kamala Jayawardena', phone: '+94774444444', relationship: 'Wife' }, subscription: { plan: 'premium', isActive: true, autoRenew: true } },
        { userId: patientUsers[4]._id, bloodGroup: 'O-', height: 165, weight: 60, allergies: [], chronicConditions: [], emergencyContact: { name: 'Gamini Silva', phone: '+94775555555', relationship: 'Husband' }, subscription: { plan: 'free', isActive: true, autoRenew: false } },
        { userId: patientUsers[5]._id, bloodGroup: 'B-', height: 178, weight: 85, allergies: ['Sulfa drugs'], chronicConditions: ['Cardiac condition'], emergencyContact: { name: 'Sriyani Rathnayake', phone: '+94776666666', relationship: 'Wife' }, subscription: { plan: 'basic', isActive: true, autoRenew: true } },
    ]);
    console.log(`  ✓ Created ${patientProfiles.length} patient profiles`);

    // ─── APPOINTMENTS ──────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = (offset: number) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt; };

    const appointments = await Appointment.insertMany([
        // Today — mix of statuses (for doctor dashboard)
        { patientId: patientUsers[0]._id, doctorId: doctorProfiles[0]._id, date: d(0), startTime: '09:00', endTime: '09:30', type: 'video', status: 'completed', reason: 'Follow-up', symptoms: ['Blood pressure check'], payment: { amount: 2500, status: 'completed', paidAt: d(0) }, consultation: { duration: 25 } },
        { patientId: patientUsers[1]._id, doctorId: doctorProfiles[0]._id, date: d(0), startTime: '10:30', endTime: '11:00', type: 'chat', status: 'completed', reason: 'New Consultation', symptoms: ['High sugar levels'], payment: { amount: 1500, status: 'completed', paidAt: d(0) }, consultation: { duration: 20 } },
        { patientId: patientUsers[2]._id, doctorId: doctorProfiles[0]._id, date: d(0), startTime: '14:00', endTime: '14:30', type: 'video', status: 'confirmed', reason: 'Pregnancy Check-up', symptoms: ['Routine checkup'], payment: { amount: 2500, status: 'completed', paidAt: d(-1) } },
        { patientId: patientUsers[3]._id, doctorId: doctorProfiles[0]._id, date: d(0), startTime: '15:30', endTime: '16:00', type: 'video', status: 'confirmed', reason: 'Prescription Review', symptoms: ['Back pain', 'Joint stiffness'], payment: { amount: 2500, status: 'completed', paidAt: d(-1) } },
        // Tomorrow
        { patientId: patientUsers[4]._id, doctorId: doctorProfiles[0]._id, date: d(1), startTime: '09:00', endTime: '09:30', type: 'video', status: 'confirmed', reason: 'Dengue Screening', symptoms: ['Fever', 'Body pain'], payment: { amount: 2500, status: 'completed', paidAt: d(0) } },
        { patientId: patientUsers[5]._id, doctorId: doctorProfiles[0]._id, date: d(1), startTime: '10:00', endTime: '10:30', type: 'video', status: 'pending', reason: 'Cardiac Follow-up', symptoms: ['Chest discomfort'], payment: { amount: 2500, status: 'pending' } },
        // Past (various doctors)
        { patientId: patientUsers[0]._id, doctorId: doctorProfiles[1]._id, date: d(-5), startTime: '10:00', endTime: '10:30', type: 'video', status: 'completed', reason: 'Heart checkup', symptoms: ['Palpitations'], payment: { amount: 3500, status: 'completed', paidAt: d(-5) }, consultation: { duration: 28 } },
        { patientId: patientUsers[0]._id, doctorId: doctorProfiles[0]._id, date: d(-10), startTime: '09:30', endTime: '10:00', type: 'video', status: 'completed', reason: 'BP follow-up', symptoms: ['Headache', 'Dizziness'], payment: { amount: 2500, status: 'completed', paidAt: d(-10) }, consultation: { duration: 22 } },
        { patientId: patientUsers[1]._id, doctorId: doctorProfiles[4]._id, date: d(-12), startTime: '11:00', endTime: '11:30', type: 'video', status: 'completed', reason: 'Knee pain', symptoms: ['Knee swelling', 'Difficulty walking'], payment: { amount: 4000, status: 'completed', paidAt: d(-12) }, consultation: { duration: 30 } },
        { patientId: patientUsers[2]._id, doctorId: doctorProfiles[3]._id, date: d(-15), startTime: '08:30', endTime: '09:00', type: 'chat', status: 'completed', reason: 'Child vaccination query', symptoms: [], payment: { amount: 2800, status: 'completed', paidAt: d(-15) }, consultation: { duration: 18 } },
        // Cancelled
        { patientId: patientUsers[4]._id, doctorId: doctorProfiles[5]._id, date: d(-7), startTime: '14:00', endTime: '14:30', type: 'video', status: 'cancelled', reason: 'Migraine', symptoms: ['Severe headache'], payment: { amount: 3500, status: 'refunded' }, cancelReason: 'Doctor unavailable' },
        // Future
        { patientId: patientUsers[0]._id, doctorId: doctorProfiles[1]._id, date: d(5), startTime: '14:00', endTime: '14:30', type: 'video', status: 'confirmed', reason: 'Cardiac follow-up', symptoms: [], payment: { amount: 3500, status: 'completed', paidAt: d(0) } },
        { patientId: patientUsers[0]._id, doctorId: doctorProfiles[2]._id, date: d(9), startTime: '11:30', endTime: '12:00', type: 'video', status: 'pending', reason: 'Skin rash', symptoms: ['Rash', 'Itching'], payment: { amount: 3000, status: 'pending' } },
        // More past for doctor[0] earnings
        { patientId: patientUsers[2]._id, doctorId: doctorProfiles[0]._id, date: d(-20), startTime: '09:00', endTime: '09:30', type: 'video', status: 'completed', reason: 'General checkup', symptoms: [], payment: { amount: 2500, status: 'completed', paidAt: d(-20) }, consultation: { duration: 20 } },
        { patientId: patientUsers[3]._id, doctorId: doctorProfiles[0]._id, date: d(-25), startTime: '10:00', endTime: '10:30', type: 'chat', status: 'completed', reason: 'Medication review', symptoms: ['Back pain'], payment: { amount: 1500, status: 'completed', paidAt: d(-25) }, consultation: { duration: 15 } },
        { patientId: patientUsers[4]._id, doctorId: doctorProfiles[0]._id, date: d(-30), startTime: '11:00', endTime: '11:30', type: 'video', status: 'completed', reason: 'Follow-up', symptoms: [], payment: { amount: 2500, status: 'completed', paidAt: d(-30) }, consultation: { duration: 22 } },
        { patientId: patientUsers[5]._id, doctorId: doctorProfiles[0]._id, date: d(-35), startTime: '09:00', endTime: '09:30', type: 'video', status: 'completed', reason: 'BP check', symptoms: ['Fatigue'], payment: { amount: 2500, status: 'completed', paidAt: d(-35) }, consultation: { duration: 18 } },
        { patientId: patientUsers[0]._id, doctorId: doctorProfiles[0]._id, date: d(-40), startTime: '14:00', endTime: '14:30', type: 'follow_up', status: 'completed', reason: 'Follow-up', symptoms: [], payment: { amount: 1500, status: 'completed', paidAt: d(-40) }, consultation: { duration: 12 } },
        { patientId: patientUsers[1]._id, doctorId: doctorProfiles[0]._id, date: d(-50), startTime: '10:00', endTime: '10:30', type: 'video', status: 'completed', reason: 'Diabetes management', symptoms: ['Thirst', 'Frequent urination'], payment: { amount: 2500, status: 'completed', paidAt: d(-50) }, consultation: { duration: 25 } },
        { patientId: patientUsers[3]._id, doctorId: doctorProfiles[0]._id, date: d(-60), startTime: '11:00', endTime: '11:30', type: 'video', status: 'completed', reason: 'Initial consultation', symptoms: ['Back pain', 'Numbness'], payment: { amount: 2500, status: 'completed', paidAt: d(-60) }, consultation: { duration: 28 } },
    ]);
    console.log(`  ✓ Created ${appointments.length} appointments`);

    // ─── HEALTH RECORDS ─────────────────────────────────
    const healthRecords = await HealthRecord.insertMany([
        { patientId: patientUsers[0]._id, title: 'Prescription - Dr. Chamara', category: 'prescription', description: 'Blood pressure medication', date: d(-5), doctor: 'Dr. Chamara Wickramasinghe', hospital: 'Colombo General Hospital', tags: ['hypertension'] },
        { patientId: patientUsers[0]._id, title: 'Blood Test Report - FBC', category: 'lab_report', description: 'Full blood count', date: d(-10), doctor: 'Dr. Chamara Wickramasinghe', hospital: 'Nawaloka Hospital', tags: ['blood', 'routine'] },
        { patientId: patientUsers[0]._id, title: 'ECG Report', category: 'lab_report', description: 'Electrocardiogram report', date: d(-15), doctor: 'Dr. Priyanka Gunawardena', hospital: 'Kandy Teaching Hospital', tags: ['cardiac', 'ecg'] },
        { patientId: patientUsers[0]._id, title: 'Prescription - Dr. Priyanka', category: 'prescription', description: 'Heart medication', date: d(-20), doctor: 'Dr. Priyanka Gunawardena', tags: ['cardiac'] },
        { patientId: patientUsers[0]._id, title: 'Medical Certificate', category: 'other', description: 'Medical leave certificate', date: d(-25), doctor: 'Dr. Chamara Wickramasinghe', tags: ['certificate'] },
        { patientId: patientUsers[1]._id, title: 'HbA1c Test Report', category: 'lab_report', description: 'Glycated hemoglobin test', date: d(-8), doctor: 'Dr. Chamara Wickramasinghe', hospital: 'Asiri Hospital', tags: ['diabetes'] },
        { patientId: patientUsers[1]._id, title: 'X-Ray - Right Knee', category: 'imaging', description: 'Knee X-ray for pain assessment', date: d(-12), doctor: 'Dr. Anura Dissanayake', hospital: 'Kurunegala Teaching Hospital', tags: ['orthopedic', 'xray'] },
        { patientId: patientUsers[3]._id, title: 'MRI - Lumbar Spine', category: 'imaging', description: 'MRI scan for chronic back pain', date: d(-30), doctor: 'Dr. Anura Dissanayake', hospital: 'Lanka Hospitals', tags: ['spine', 'mri'] },
    ]);
    console.log(`  ✓ Created ${healthRecords.length} health records`);

    // ─── HEALTH TIPS ────────────────────────────────────
    const healthTips = await HealthTip.insertMany([
        { title: 'Stay Hydrated During Monsoon Season', content: 'During the monsoon season in Sri Lanka, it\'s crucial to stay hydrated. Drink at least 8 glasses of clean water daily. Avoid street food and ensure proper hand hygiene to prevent waterborne diseases.', category: 'disease_prevention', language: 'en', tags: ['monsoon', 'hydration', 'prevention'], isPublished: true, publishedAt: d(-2), viewCount: 245 },
        { title: 'Dengue Prevention: Protect Your Family', content: 'Dengue fever cases rise during rainy periods. Remove stagnant water from flower pots, tires, and drains. Use mosquito repellent and nets. Seek medical attention if you experience high fever with body pain.', category: 'disease_prevention', language: 'en', tags: ['dengue', 'mosquito', 'prevention'], isPublished: true, publishedAt: d(-5), viewCount: 512 },
        { title: 'Managing Diabetes with Sri Lankan Diet', content: 'Traditional Sri Lankan foods can be diabetic-friendly. Choose brown rice over white, include bitter gourd (karawila), and reduce sugar in tea. Regular walking for 30 minutes helps control blood sugar.', category: 'nutrition', language: 'en', tags: ['diabetes', 'diet', 'nutrition'], isPublished: true, publishedAt: d(-8), viewCount: 380 },
        { title: 'Mental Health Awareness: It\'s Okay to Ask for Help', content: 'Mental health is just as important as physical health. If you\'re feeling overwhelmed, anxious, or depressed, reach out to a professional. SuwaMed connects you with certified psychiatrists for confidential consultations.', category: 'mental_health', language: 'en', tags: ['mental health', 'anxiety', 'depression'], isPublished: true, publishedAt: d(-12), viewCount: 290 },
        { title: 'Child Vaccination Schedule in Sri Lanka', content: 'Follow the National Immunization Programme schedule. Key vaccines include BCG at birth, Pentavalent at 2, 4, 6 months, and MMR at 12 months. Consult your pediatrician for catch-up schedules.', category: 'child_health', language: 'en', tags: ['vaccination', 'children', 'immunization'], isPublished: true, publishedAt: d(-15), viewCount: 420 },
        { title: 'First Aid for Snake Bites', content: 'Sri Lanka has venomous snakes like the Russell\'s viper and cobra. If bitten: keep calm, immobilize the affected limb, and get to the nearest hospital immediately. Do NOT apply tourniquets or try to suck out venom.', category: 'first_aid', language: 'en', tags: ['snake bite', 'first aid', 'emergency'], isPublished: true, publishedAt: d(-20), viewCount: 680 },
    ]);
    console.log(`  ✓ Created ${healthTips.length} health tips`);

    // ─── REVIEWS ────────────────────────────────────────
    const reviews = await Review.insertMany([
        { appointmentId: appointments[7]._id, patientId: patientUsers[0]._id, doctorId: doctorProfiles[0]._id, rating: 5, comment: 'Dr. Chamara is very thorough and explains everything clearly. Highly recommended!' },
        { appointmentId: appointments[6]._id, patientId: patientUsers[0]._id, doctorId: doctorProfiles[1]._id, rating: 5, comment: 'Excellent cardiologist. Very knowledgeable and caring.' },
        { appointmentId: appointments[8]._id, patientId: patientUsers[1]._id, doctorId: doctorProfiles[4]._id, rating: 4, comment: 'Good consultation. The doctor was professional and helpful.' },
        { appointmentId: appointments[9]._id, patientId: patientUsers[2]._id, doctorId: doctorProfiles[3]._id, rating: 5, comment: 'Very patient with my questions about child vaccinations. Thank you!' },
        { appointmentId: appointments[0]._id, patientId: patientUsers[0]._id, doctorId: doctorProfiles[0]._id, rating: 5, comment: 'Great follow-up. Always attentive to my BP readings.', response: { text: 'Thank you for your kind words! See you at your next check-up.', respondedAt: d(-1) } },
    ]);
    console.log(`  ✓ Created ${reviews.length} reviews`);

    // ─── PAYMENTS ───────────────────────────────────────
    const payments = await Payment.insertMany([
        { userId: patientUsers[0]._id, type: 'consultation', amount: 2500, currency: 'LKR', status: 'completed', gateway: 'card', appointmentId: appointments[0]._id },
        { userId: patientUsers[1]._id, type: 'consultation', amount: 1500, currency: 'LKR', status: 'completed', gateway: 'card', appointmentId: appointments[1]._id },
        { userId: patientUsers[0]._id, type: 'consultation', amount: 3500, currency: 'LKR', status: 'completed', gateway: 'payhere', appointmentId: appointments[6]._id },
        { userId: patientUsers[0]._id, type: 'subscription', amount: 1500, currency: 'LKR', status: 'completed', gateway: 'card' },
        { userId: patientUsers[1]._id, type: 'consultation', amount: 4000, currency: 'LKR', status: 'completed', gateway: 'payhere', appointmentId: appointments[8]._id },
    ]);
    console.log(`  ✓ Created ${payments.length} payments`);

    // ─── PRESCRIPTIONS ──────────────────────────────────
    const prescriptions = await Prescription.insertMany([
        {
            appointmentId: appointments[0]._id, doctorId: doctorProfiles[0]._id, patientId: patientUsers[0]._id,
            diagnosis: 'Essential Hypertension',
            medications: [
                { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning with water' },
                { name: 'Metoprolol', dosage: '25mg', frequency: 'Twice daily', duration: '30 days', instructions: 'Take after meals' },
            ],
            additionalNotes: 'Monitor blood pressure daily. Reduce salt intake. Avoid caffeine.',
            followUpDate: d(14), followUpInstructions: 'Return for BP check in 2 weeks', issuedAt: d(0),
        },
        {
            appointmentId: appointments[7]._id, doctorId: doctorProfiles[0]._id, patientId: patientUsers[0]._id,
            diagnosis: 'Hypertension - Follow-up',
            medications: [
                { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Continue as before' },
            ],
            additionalNotes: 'BP stable. Continue current medication regimen.', issuedAt: d(-10),
        },
        {
            appointmentId: appointments[6]._id, doctorId: doctorProfiles[1]._id, patientId: patientUsers[0]._id,
            diagnosis: 'Cardiac Arrhythmia - mild',
            medications: [
                { name: 'Bisoprolol', dosage: '2.5mg', frequency: 'Once daily', duration: '60 days', instructions: 'Take in the morning' },
                { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '60 days', instructions: 'Take after breakfast' },
            ],
            additionalNotes: 'Repeat ECG in 2 months. Avoid strenuous exercise. Call emergency if chest pain.',
            followUpDate: d(-5 + 60), followUpInstructions: 'Repeat ECG and consultation', issuedAt: d(-5),
        },
    ]);
    console.log(`  ✓ Created ${prescriptions.length} prescriptions`);

    // ─── SYMPTOM CHECKS ─────────────────────────────────
    const symptomChecks = await SymptomCheck.insertMany([
        {
            patientId: patientUsers[0]._id,
            symptoms: [{ name: 'Headache', severity: 'moderate', bodyPart: 'head' }, { name: 'Dizziness', severity: 'mild', bodyPart: 'head' }],
            additionalInfo: { existingConditions: ['Hypertension'], currentMedications: ['Amlodipine'] },
            aiResponse: {
                possibleConditions: [{ name: 'Hypertension-related headache', probability: 0.75, description: 'May be related to elevated blood pressure.' }],
                recommendation: 'consult_doctor',
                selfCareAdvice: 'Rest, stay hydrated, monitor BP. See doctor if BP elevated.',
                suggestedSpecializations: ['General Practitioner'],
                disclaimer: 'This is for informational purposes only. Always consult a doctor.',
            },
            language: 'en', severity: 'moderate',
            createdAt: d(-3),
        },
        {
            patientId: patientUsers[0]._id,
            symptoms: [{ name: 'Cough', severity: 'mild', bodyPart: 'chest' }, { name: 'Sore Throat', severity: 'mild', bodyPart: 'chest' }, { name: 'Fever', severity: 'mild', bodyPart: 'general' }],
            additionalInfo: { existingConditions: ['Hypertension'], currentMedications: [] },
            aiResponse: {
                possibleConditions: [{ name: 'Respiratory infection', probability: 0.70, description: 'Symptoms are consistent with an upper respiratory tract infection.' }],
                recommendation: 'consult_doctor',
                selfCareAdvice: 'Rest, fluids, honey and ginger tea.',
                suggestedSpecializations: ['General Practitioner'],
                disclaimer: 'This is for informational purposes only.',
            },
            language: 'en', severity: 'mild',
            createdAt: d(-15),
        },
    ]);
    console.log(`  ✓ Created ${symptomChecks.length} symptom checks`);

    // ─── NOTIFICATIONS ──────────────────────────────────
    await Notification.insertMany([
        { userId: patientUsers[0]._id, type: 'appointment_confirmed', title: 'Appointment Confirmed', body: 'Your appointment with Dr. Priyanka Gunawardena on ' + d(5).toLocaleDateString() + ' at 14:00 is confirmed.', isRead: false },
        { userId: patientUsers[0]._id, type: 'prescription_ready', title: 'Prescription Ready', body: 'Dr. Chamara Wickramasinghe has issued a new prescription for you.', isRead: true, readAt: d(-1) },
        { userId: patientUsers[0]._id, type: 'appointment_reminder', title: 'Appointment Tomorrow', body: 'Reminder: You have an appointment with Dr. Anura Dissanayake tomorrow at 09:00.', isRead: false },
        { userId: patientUsers[0]._id, type: 'health_tip', title: 'New Health Tip', body: 'Check out our latest tip on managing dengue prevention during monsoon.', isRead: false },
        { userId: patientUsers[0]._id, type: 'payment_received', title: 'Payment Received', body: 'Payment of LKR 3,500 received for your consultation with Dr. Priyanka.', isRead: true, readAt: d(-5) },
        { userId: doctorUsers[0]._id, type: 'appointment_confirmed', title: 'New Appointment', body: 'A new appointment has been booked by Kumari Perera for tomorrow at 09:00.', isRead: false },
        { userId: doctorUsers[0]._id, type: 'payment_received', title: 'Payment Received', body: 'You received LKR 2,500 for consultation with Kumari Perera.', isRead: true, readAt: d(-1) },
        { userId: doctorUsers[0]._id, type: 'review_request', title: 'New Review', body: 'Kumari Perera left you a 5-star review. Well done!', isRead: false },
    ]);
    console.log('  ✓ Created notifications');

    console.log('\n✅ Database seeded successfully!');
    console.log(`
📋 Test Accounts:
  Admin:   admin@suwamed.lk  / Admin@123
  Doctor:  chamara@suwamed.lk / Doctor@123
  Patient: kumari@suwamed.lk  / Patient@123
  `);
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
