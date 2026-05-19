import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const presc = mongoose.connection.db!.collection('prescriptions');
  const docs = await presc.find({}).toArray();
  for (const d of docs) {
    console.log(`_id=${d._id}  diagnosis="${d.diagnosis}"  pdfUrl=${d.pdfUrl ? d.pdfUrl.slice(0,80) + '...' : 'MISSING'}`);
  }
  await mongoose.disconnect();
  process.exit(0);
})();
