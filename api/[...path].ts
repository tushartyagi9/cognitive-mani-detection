import app from '../Mindguard/server/index.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}

export const config = {
  runtime: 'nodejs',
};
