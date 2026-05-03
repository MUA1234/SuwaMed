import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server';
import connectDB from '../src/config/database';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await connectDB();
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
