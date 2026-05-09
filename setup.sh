#!/usr/bin/env bash
# StreamVision Insights Assistant — local setup script
set -euo pipefail

echo "========================================"
echo "  StreamVision Insights Assistant Setup"
echo "========================================"

# ── Check Python ─────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "ERROR: Python 3.11+ is required."
    exit 1
fi

PY_VER=$(python3 -c "import sys; print(sys.version_info.minor)")
if [ "$PY_VER" -lt 10 ]; then
    echo "ERROR: Python 3.10+ required, found 3.$PY_VER"
    exit 1
fi

# ── Check Node ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js 18+ is required."
    exit 1
fi

# ── Backend setup ─────────────────────────────────────────────────────────────
echo ""
echo "→ Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  Created backend/.env from template."
    echo ""
    echo "  IMPORTANT: Edit backend/.env and set your GEMINI_API_KEY"
    echo "  Get one at https://aistudio.google.com/apikey"
    echo ""
fi

if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

echo "  Installing Python dependencies..."
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo "  Seeding database and generating data..."
python3 -m app.ingestion.seed_db
python3 -m app.ingestion.generate_pdfs
python3 -m app.ingestion.ingest_documents

deactivate
cd ..

# ── Frontend setup ────────────────────────────────────────────────────────────
echo ""
echo "→ Setting up frontend..."
cd frontend

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "  Created frontend/.env.local"
fi

echo "  Installing Node dependencies..."
npm install --silent

cd ..

echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "Start the backend:"
echo "  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "Start the frontend (new terminal):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "API docs: http://localhost:8000/docs"
echo "Health:   http://localhost:8000/health"
