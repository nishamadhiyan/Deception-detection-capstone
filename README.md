# VERITAS — Smart Deception Detection Using Computer Vision

Full-stack capstone project: Flask + MediaPipe backend for facial
micro-feature extraction and SVM/MLP classification, with a React/Vite
forensic-console frontend.

## Project structure

```
backend/     Flask API, MediaPipe feature extraction, trained SVM/MLP model
frontend/    React + Vite "VERITAS" case-file console UI
```

## 1. Run locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:5000`. A trained model already ships in
`backend/models/`. To retrain (e.g. with your own labeled data):

```bash
python train_model.py --synthetic       # quick synthetic dataset
python train_model.py --csv data/features.csv   # your own labeled data
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and talks to the backend at
`http://localhost:5000` by default (see `frontend/src/lib/api.js`).

## 2. Deploy live (free tier)

### Backend → Render

1. Push this repo to GitHub.
2. On [render.com](https://render.com), New → Web Service → connect the repo,
   set **root directory** to `backend`.
3. Render will pick up `render.yaml` automatically (build: `pip install -r
   requirements.txt`, start: `gunicorn app:app ...`). Otherwise set those
   commands manually.
4. After deploy, copy the service URL, e.g. `https://veritas-deception-backend.onrender.com`.
5. (Optional but recommended) Add an environment variable
   `ALLOWED_ORIGIN=https://<your-vercel-app>.vercel.app` once the frontend
   is deployed, to lock down CORS.

Note: Render's free tier spins down on inactivity — the first request after
idling can take ~30-50s to wake up.

### Frontend → Vercel

1. On [vercel.com](https://vercel.com), New Project → import the same repo,
   set **root directory** to `frontend`.
2. Framework preset: Vite. Build command `npm run build`, output `dist`
   (already declared in `vercel.json`).
3. Add environment variable `VITE_API_URL` = your Render backend URL from
   above (no trailing slash).
4. Deploy. Your live app will be at `https://<project>.vercel.app`.

### Camera permissions note

Browsers only allow webcam access (`getUserMedia`) on **HTTPS** or
`localhost`. Both Vercel and Render serve HTTPS by default, so the deployed
version works out of the box.

## 3. How it works

1. Frontend captures a JPEG frame from the webcam every ~900ms and POSTs it
   (base64) to `/api/session/<id>/analyze`.
2. Backend runs MediaPipe Face Mesh, computes EAR, MAR, gaze ratio, head
   pose (pitch/yaw/roll via solvePnP), and rolling blink rate.
3. The SVM/MLP classifier (trained on `train_model.py`) turns the feature
   vector into a deception probability; a heuristic fallback keeps the API
   functional even without a trained model.
4. The console renders a live biometric readout, a deception-probability
   gauge, a frame-by-frame case log, and a final session report on stop.

## Academic note

This is a final-year demonstration system. The bundled model is trained on
a synthetic-but-literature-grounded dataset (see `train_model.py`) unless
you supply real labeled data — treat outputs as illustrative, not as a
validated forensic tool.
