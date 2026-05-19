import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const dbs = await mongoose.connection.db!.admin().listDatabases();
  console.log('DATABASES:');
  for (const d of dbs.databases) {
    console.log(`  - ${d.name} (size: ${d.sizeOnDisk})`);
  }
  const cur = mongoose.connection.name;
  console.log(`CURRENT DB: ${cur}`);
  const cols = await mongoose.connection.db!.listCollections().toArray();
  console.log(`COLLECTIONS in ${cur}:`);
  for (const c of cols) console.log(`  - ${c.name}`);

  if (cols.find((c: any) => c.name === 'users')) {
    const users = mongoose.connection.db!.collection('users');
    const kumari = await users.findOne({ email: 'kumari@suwamed.lk' });
    console.log('KUMARI USER:', kumari ? `_id=${kumari._id}` : 'NOT FOUND');
  }
  if (cols.find((c: any) => c.name === 'prescriptions')) {
    const presc = mongoose.connection.db!.collection('prescriptions');
    const count = await presc.countDocuments();
    console.log(`PRESCRIPTIONS: ${count}`);
    const samples = await presc.find({}).limit(5).toArray();
    for (const s of samples) console.log(`  - _id=${s._id} patientId=${s.patientId} diagnosis=${s.diagnosis}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((e: any) => { console.error('PROBE ERROR:', e.message); process.exit(1); });
