import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze.js';
import { articlePreviewRouter } from './routes/articlePreview.js';
import { historyRouter } from './routes/history.js';
import { evaluationRouter } from './routes/evaluationReport.js';
import { errorHandler } from './middleware/errorHandler.js';

// ─── Optional integration summary ────────────────────────────────────────────
// The rule-based analysis tier is self-contained, so no provider key is needed
// for the API to start. Each integration validates its own configuration when a
// feature that needs it is requested.
const optionalServices = {
  groq: !!process.env.GROQ_API_KEY,
  huggingface: !!process.env.HUGGINGFACE_API_KEY,
  firecrawl: !!process.env.FIRECRAWL_API_KEY,
  supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  openaiEvaluation: !!process.env.OPENAI_API_KEY,
};

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
}));

app.use(express.json({ limit: '2mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);
app.use('/api/article-preview', articlePreviewRouter);
app.use('/api/history', historyRouter);
app.use('/api/evaluation', evaluationRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      groq: optionalServices.groq,
      huggingface: optionalServices.huggingface,
      firecrawl: optionalServices.firecrawl,
      supabase: optionalServices.supabase,
      openaiEvaluation: optionalServices.openaiEvaluation,
    },
  });
});

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// Export the app for serverless deployments (Vercel) and only listen when
// running locally (not in the Vercel serverless environment).
export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🛡  MindGuard API  →  http://localhost:${PORT}`);
    console.log(`   Health check   →  http://localhost:${PORT}/api/health\n`);
  });
}
