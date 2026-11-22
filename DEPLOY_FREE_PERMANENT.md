# Free Permanent Deployment Guide (Neon + Hugging Face Spaces + Vercel)

**Stack:**
- **Database:** Neon (PostgreSQL + pgvector, free tier, never expires)
- **Backend:** Hugging Face Spaces (Docker, 2 vCPU / 16 GB RAM, free, never expires)
- **Frontend:** Vercel (Hobby tier, free, never expires)

---

## 1. Database — Neon (Free PostgreSQL + pgvector)

1. Go to [console.neon.tech](https://console.neon.tech) → Sign up with GitHub
2. Create Project:
   - Name: `campus-one-db`
   - Region: closest to you
   - PostgreSQL version: 16
3. Once created, go to **Settings** → **Extensions** → Enable **`vector`** (pgvector)
4. Copy **Connection String** (pooled):
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. **Modify for SQLAlchemy** — add `+psycopg`:
   ```
   postgresql+psycopg://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Save this as `DATABASE_URL`

---

## 2. Index Documents (Run Once from Laptop)

```bash
cd backend
export DATABASE_URL="postgresql+psycopg://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
export GROQ_API_KEY="your_groq_key"
python index_documents.py
```

This populates the cloud DB with embeddings. Only needs to run once.

---

## 3. Backend — Hugging Face Spaces (Docker)

### 3.1 Create Space
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Owner: your account
3. Space name: `campusone-api`
4. License: MIT (or your choice)
5. **SDK: Docker**
6. Hardware: **CPU Basic (2 vCPU, 16 GB RAM)** — FREE
7. Create Space

### 3.2 Push Code
```bash
# In your repo root
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/campusone-api
git push hf main
```

Or use the HF CLI:
```bash
hf space create YOUR_USERNAME/campusone-api --sdk docker
hf space push YOUR_USERNAME/campusone-api
```

### 3.3 Set Secrets (Space Settings → Repository Settings → Secrets)
| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Your Neon connection string (with `+psycopg`) |
| `GROQ_API_KEY` | Your Groq API key |
| `LANGSMITH_TRACING` | `false` |
| `LANGSMITH_API_KEY` | Optional |
| `LANGSMITH_PROJECT` | `campus-one` |

### 3.4 Get Backend URL
After build succeeds (2-5 min):
```
https://YOUR_USERNAME-campusone-api.hf.space
```
Health check: `https://YOUR_USERNAME-campusone-api.hf.space/api/v1/health`

---

## 4. Frontend — Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `kvnishkdhiman/campus-one`
3. Root Directory: `frontend`
4. Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR_USERNAME-campusone-api.hf.space/api/v1`
5. Deploy

---

## 5. Verify End-to-End

| URL | Purpose |
|-----|---------|
| `https://your-frontend.vercel.app` | Student workspace, login, tickets |
| `https://your-frontend.vercel.app/admin` | Admin console (login: `admin@example.edu` / `demo-password`) |
| `https://YOUR_USERNAME-campusone-api.hf.space/api/v1/health` | Backend health |
| `https://YOUR_USERNAME-campusone-api.hf.space/docs` | FastAPI Swagger UI |

---

## 6. Why This Is Permanent

| Component | Free Tier Limits | Expiry |
|-----------|------------------|--------|
| Neon | 0.5 GB storage, 1 compute unit | Never |
| HF Spaces (CPU Basic) | 2 vCPU, 16 GB RAM, 50 GB disk | Never |
| Vercel Hobby | Unlimited personal projects | Never |

No credit card, no trial expiry, no $5 credit burnout.

---

## Files in Repo

- `backend/Dockerfile.hf` — Optimized for HF Spaces (port 7860, caches)
- `backend/requirements.txt` — All dependencies
- `backend/railway.json` — Kept for reference (not needed for HF)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `torch`/`sentence-transformers` | 16 GB RAM on HF Basic handles it; if OOM, add `--no-cache-dir` to pip install |
| `index_documents.py` fails | Ensure `DATABASE_URL` has `+psycopg` and Neon `vector` extension enabled |
| CORS errors | Add Vercel domain to `CORS_ORIGINS` in backend `app/main.py` or `settings.py` |
| Space sleeps on first request | Normal — wakes in 10-15s. Add a cron ping if needed. |
| pgvector not found | Enable `vector` extension in Neon dashboard before running index_documents |