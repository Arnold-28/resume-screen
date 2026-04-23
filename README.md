# Resume Screening System (ML + Web App)

End-to-end resume screening platform with:

- Flask API backend
- Decision Tree based role and category prediction
- Resume ranking score
- Job role recommendation
- Skill gap analysis
- React + Tailwind candidate dashboard
- Admin panel for sorting and CSV export

## Architecture

- `backend/`: Flask + ML + SQLite
- `frontend/`: React + Tailwind (Vite)

## Features Implemented

1. Decision Tree model usage for predictions:
	- `DecisionTreeClassifier(max_depth=10)` for job role
	- `DecisionTreeClassifier(max_depth=10)` for candidate category
2. Smart screening:
	- Resume ranking score (%)
	- Top role recommendations with confidence
	- Skill extraction and skill-gap analysis
3. Modern frontend:
	- React + Tailwind UI
	- Drag-and-drop upload
	- Candidate-facing screening dashboard
4. Admin panel:
	- View all candidates
	- Sort by score/name/role/date
	- Export records to CSV

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs at:

- `http://127.0.0.1:5000`

## Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

- `http://127.0.0.1:5173`

## API Endpoints

- `GET /api/health` - service health
- `POST /api/screen` - upload and analyze resume
  - form-data fields:
	 - `resume` (pdf/txt)
	 - `candidate_name` (optional)
	 - `email` (optional)
	 - `required_skills` (optional, comma-separated)
- `GET /api/candidates?sortBy=ranking_score&order=desc` - list candidates
- `GET /api/candidates/export` - CSV export
- `GET /api/stats` - admin metrics

## Notes

- Uploaded resumes are stored in `backend/uploads/`.
- Candidate records are stored in `backend/data/candidates.db`.
- Training seed data is in `backend/data/training_data.csv`.