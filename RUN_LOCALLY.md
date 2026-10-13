# How to run locally (no Docker)

## Prerequisites
- Python 3.9+ 
- Node.js 20+
- PostgreSQL (running locally)
- FFmpeg installed

## Backend
1. Start PostgreSQL (you have it). Create DB/user as needed.
2. `cd backend`
3. Copy `.env.example` to `.env` and set:
   - DATABASE_URL=postgresql://user:password@localhost:5432/my_video_app
   - SPACES_* values (use test creds if just testing locally; uploads require valid Spaces)
4. `pip install -r requirements.txt`
5. `python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## Frontend
1. `cd frontend`
2. Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:8000`
3. `npm install`
4. `npm run dev` (runs on http://localhost:5173)

Frontend will talk to backend on :8000. Both run on different ports (5173 vs 8000).
