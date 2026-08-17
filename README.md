# CogniGuard — Cognitive Manipulation Detection

CogniGuard is a research prototype for identifying cognitive manipulation in text, with a focus on email and news content. Its API uses a resilient three-tier strategy: optional Hugging Face zero-shot classification, optional Groq LLM analysis, then a built-in rule-based fallback. The fallback keeps text analysis available with no provider account or API key.

## Architecture

`Mindguard` is the application root. It intentionally contains the Vite client (`src/`) and the Express API (`server/`) in one deployable package; this keeps same-origin browser/API deployments simple. Python files are offline research, training, dataset-preparation, and evaluation utilities. They are not called by Express and are not required in production.

```text
.
├── api/                         # Vercel serverless API wrapper
├── Mindguard/
│   ├── src/                     # Vite + React client
│   ├── server/                  # Express API, routes, data, and services
│   ├── scripts/                 # Offline Python research/training tools
│   ├── docs/                    # Benchmark documentation
│   ├── .env.example             # Safe server/client configuration template
│   ├── requirements-research.txt
│   └── package.json
├── package.json                 # Workspace commands
└── vercel.json                  # Vercel build and SPA rewrite configuration
```

## Prerequisites

- Node.js 20 or 22 (the repository enforces `>=20 <23`)
- npm 10+
- Python 3.10+ only if you use the offline research scripts

## Install and run locally

```bash
npm ci
cp Mindguard/.env.example Mindguard/.env
npm run dev:server
```

In another terminal, start the Vite client:

```bash
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to Express at `http://localhost:3001` during development. Check the API with `http://localhost:3001/api/health`.

For both processes in one terminal, run:

```bash
npm --workspace Mindguard run dev:all
```

## Environment variables

Copy `Mindguard/.env.example` to `Mindguard/.env`. Never use `VITE_` for a private key.

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | Express | API port; defaults to `3001`. |
| `ALLOWED_ORIGIN` | No | Express CORS | Frontend origin when client and API use different domains. |
| `VITE_API_BASE_URL` | No | React client | Separate API base URL; leave blank for same-origin/Vercel. |
| `GROQ_API_KEY` | No | Express | Enables Groq LLM analysis. |
| `HUGGINGFACE_API_KEY` | No | Express | Enables Hugging Face zero-shot analysis. |
| `FIRECRAWL_API_KEY` | No | Express | Enables URL/article extraction. |
| `SUPABASE_URL` | No | Express | Enables persistent analysis history. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Express | Server-only Supabase access for history. |
| `OPENAI_API_KEY` | No | Express | Used only by the internal model-evaluation endpoint. |

No provider key is required for the standard text detection endpoint: when optional providers are absent, CogniGuard uses its rule-based tier. URL analysis specifically needs `FIRECRAWL_API_KEY`; persistent history needs both Supabase variables.

## Verification and production build

```bash
npm run typecheck
npm run build
npm run server:start
```

The static output is `Mindguard/dist`. `npm start` is an alias for the Express production server command.

## Deploy to Vercel (recommended)

Deploy this repository with its root directory set to the repository root. Vercel runs `npm run build`, serves `Mindguard/dist`, and deploys `api/[...path].ts` as the Express serverless API. The rewrite in `vercel.json` sends client-side routes such as `/results`, `/compare`, and `/admin/evaluation` to the SPA while leaving `/api/*` with the serverless function.

Set only the integrations you intend to use in Vercel Project Settings → Environment Variables. For the single-service Vercel deployment, leave `VITE_API_BASE_URL` blank and normally leave `ALLOWED_ORIGIN` at its local default because the client and API share an origin. If the frontend is hosted elsewhere, set both variables to the appropriate deployed URLs.

## Python research tools

The Python pipeline is separate from the deployed service. To use it locally:

```bash
python -m venv .venv
.venv/bin/pip install -r Mindguard/requirements-research.txt
```

Model training/inference scripts may download datasets and model weights; these artifacts are intentionally excluded from Git. Do not deploy Python or model dependencies unless you deliberately replace the API's hosted-provider/rule-based pipeline with local model inference.

## Troubleshooting

- **`npm ci` warns about Node:** use Node 20 or 22; newer unsupported majors can work but are not a deployment target.
- **Analysis uses a fallback:** inspect `/api/health` and set the optional provider variable for the desired tier.
- **URL analysis fails:** set a valid `FIRECRAWL_API_KEY` on the Express/Vercel server.
- **Direct navigation returns 404:** ensure the host honors the SPA rewrite in `vercel.json` (or configure an equivalent fallback on another host).
- **History does not persist:** configure both server-only Supabase variables and create the expected `analysis_history` table.
