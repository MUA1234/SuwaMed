import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import SlmcRegistry from '../src/models/SlmcRegistry.model';

const doctors = [
  {
    slmcNo: 'SLMC-10234',
    firstName: 'Ashan',
    lastName: 'Perera',
    specialization: ['Cardiologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Colombo', year: 2005 },
      { degree: 'MD (Cardiology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2010 },
    ],
    experience: 18,
    hospital: 'National Hospital Colombo',
    consultationFee: 3500,
  },
  {
    slmcNo: 'SLMC-10567',
    firstName: 'Nimali',
    lastName: 'Fernando',
    specialization: ['Dermatologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Kelaniya', year: 2008 },
      { degree: 'MD (Dermatology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2013 },
    ],
    experience: 14,
    hospital: 'Teaching Hospital Kandy',
    consultationFee: 3000,
  },
  {
    slmcNo: 'SLMC-10891',
    firstName: 'Ruwan',
    lastName: 'Jayawardena',
    specialization: ['General Practitioner'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Peradeniya', year: 2012 },
    ],
    experience: 11,
    hospital: 'Teaching Hospital Peradeniya',
    consultationFee: 1500,
  },
  {
    slmcNo: 'SLMC-11024',
    firstName: 'Kavinda',
    lastName: 'Silva',
    specialization: ['Neurologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Sri Jayewardenepura', year: 2006 },
      { degree: 'MD (Neurology)', institution: 'Royal College of Physicians, London', year: 2012 },
    ],
    experience: 17,
    hospital: 'National Hospital Colombo',
    consultationFee: 4000,
  },
  {
    slmcNo: 'SLMC-11357',
    firstName: 'Sachini',
    lastName: 'Wickramasinghe',
    specialization: ['Pediatrician'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Colombo', year: 2010 },
      { degree: 'DCH', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2014 },
      { degree: 'MD (Paediatrics)', institution: 'University of Colombo', year: 2016 },
    ],
    experience: 13,
    hospital: 'Lady Ridgeway Hospital for Children',
    consultationFee: 3000,
  },
  {
    slmcNo: 'SLMC-11682',
    firstName: 'Tharindu',
    lastName: 'Bandara',
    specialization: ['Orthopedic Surgeon'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Peradeniya', year: 2007 },
      { degree: 'MS (Orthopaedics)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2013 },
    ],
    experience: 16,
    hospital: 'Teaching Hospital Kandy',
    consultationFee: 3500,
  },
  {
    slmcNo: 'SLMC-12015',
    firstName: 'Dilini',
    lastName: 'Rajapaksa',
    specialization: ['Gynecologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Kelaniya', year: 2009 },
      { degree: 'MD (Obstetrics & Gynaecology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2015 },
    ],
    experience: 14,
    hospital: 'De Soysa Hospital for Women',
    consultationFee: 3500,
  },
  {
    slmcNo: 'SLMC-12348',
    firstName: 'Chamara',
    lastName: 'Dissanayake',
    specialization: ['Psychiatrist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Sri Jayewardenepura', year: 2011 },
      { degree: 'MD (Psychiatry)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2017 },
    ],
    experience: 12,
    hospital: 'National Institute of Mental Health, Angoda',
    consultationFee: 3000,
  },
  {
    slmcNo: 'SLMC-12671',
    firstName: 'Ishara',
    lastName: 'De Silva',
    specialization: ['Endocrinologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Colombo', year: 2008 },
      { degree: 'MD (Medicine)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2013 },
      { degree: 'MRCP (Endocrinology)', institution: 'Royal College of Physicians, UK', year: 2015 },
    ],
    experience: 15,
    hospital: 'Teaching Hospital Colombo South',
    consultationFee: 4000,
  },
  {
    slmcNo: 'SLMC-13004',
    firstName: 'Nadeesha',
    lastName: 'Gunawardena',
    specialization: ['Ophthalmologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Peradeniya', year: 2010 },
      { degree: 'MS (Ophthalmology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2016 },
    ],
    experience: 13,
    hospital: 'National Eye Hospital Colombo',
    consultationFee: 2500,
  },
  {
    slmcNo: 'SLMC-13337',
    firstName: 'Lasantha',
    lastName: 'Karunaratne',
    specialization: ['Gastroenterologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Colombo', year: 2007 },
      { degree: 'MD (Medicine)', institution: 'University of Colombo', year: 2012 },
      { degree: 'MRCP (Gastroenterology)', institution: 'Royal College of Physicians, UK', year: 2014 },
    ],
    experience: 16,
    hospital: 'Teaching Hospital Ragama',
    consultationFee: 3500,
  },
  {
    slmcNo: 'SLMC-13660',
    firstName: 'Malsha',
    lastName: 'Rathnayake',
    specialization: ['Pulmonologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Kelaniya', year: 2011 },
      { degree: 'MD (Respiratory Medicine)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2017 },
    ],
    experience: 12,
    hospital: 'National Hospital for Respiratory Diseases, Welisara',
    consultationFee: 3000,
  },
  {
    slmcNo: 'SLMC-13993',
    firstName: 'Pradeep',
    lastName: 'Samarasinghe',
    specialization: ['Urologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Sri Jayewardenepura', year: 2006 },
      { degree: 'MS (Urology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2012 },
    ],
    experience: 17,
    hospital: 'National Hospital Colombo',
    consultationFee: 4000,
  },
  {
    slmcNo: 'SLMC-14326',
    firstName: 'Sanduni',
    lastName: 'Herath',
    specialization: ['ENT Specialist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Peradeniya', year: 2013 },
      { degree: 'MS (ENT)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2019 },
    ],
    experience: 10,
    hospital: 'Teaching Hospital Kurunegala',
    consultationFee: 2500,
  },
  {
    slmcNo: 'SLMC-14659',
    firstName: 'Roshan',
    lastName: 'Amarasinghe',
    specialization: ['Oncologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Colombo', year: 2005 },
      { degree: 'MD (Oncology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2011 },
      { degree: 'Fellowship in Clinical Oncology', institution: 'Peter MacCallum Cancer Centre, Australia', year: 2014 },
    ],
    experience: 18,
    hospital: 'Apeksha Hospital (National Cancer Institute), Maharagama',
    consultationFee: 4500,
  },
  {
    slmcNo: 'SLMC-14992',
    firstName: 'Dinusha',
    lastName: 'Tennakoon',
    specialization: ['Nephrologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Kelaniya', year: 2009 },
      { degree: 'MD (Nephrology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2015 },
    ],
    experience: 14,
    hospital: 'Teaching Hospital Kandy',
    consultationFee: 3500,
  },
  {
    slmcNo: 'SLMC-15325',
    firstName: 'Hasitha',
    lastName: 'Weerasinghe',
    specialization: ['Radiologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Sri Jayewardenepura', year: 2012 },
      { degree: 'MD (Radiology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2018 },
    ],
    experience: 11,
    hospital: 'Teaching Hospital Colombo South',
    consultationFee: 3000,
  },
  {
    slmcNo: 'SLMC-15658',
    firstName: 'Amaya',
    lastName: 'Senanayake',
    specialization: ['Rheumatologist'],
    qualifications: [
      { degree: 'MBBS', institution: 'University of Colombo', year: 2010 },
      { degree: 'MD (Rheumatology)', institution: 'Postgraduate Institute of Medicine, Colombo', year: 2016 },
    ],
    experience: 13,
    hospital: 'National Hospital Colombo',
    consultationFee: 3500,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB');

    // Clear existing SLMC registry data
    await SlmcRegistry.deleteMany({});
    console.log('Cleared existing SLMC registry entries');

    // Insert all doctors
    await SlmcRegistry.insertMany(doctors);
    console.log(`\nSeeded ${doctors.length} SLMC registry entries\n`);

    // Print clean list
    console.log('='.repeat(60));
    console.log('  SLMC Registry — Seeded Doctors');
    console.log('='.repeat(60));
    for (const doc of doctors) {
      const spec = doc.specialization[0];
      console.log(`  ${doc.slmcNo}  Dr. ${doc.firstName} ${doc.lastName} (${spec})`);
    }
    console.log('='.repeat(60));
    console.log(`\nTotal: ${doctors.length} entries\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
