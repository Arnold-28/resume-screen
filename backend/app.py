import csv
import io
import os
from datetime import datetime

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from model_service import ResumeScreeningService


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
DATA_PATH = os.path.join(BASE_DIR, "data", "training_data.csv")
DB_PATH = os.path.join(BASE_DIR, "data", "candidates.db")

os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)
service = ResumeScreeningService(DATA_PATH, DB_PATH)


@app.get("/")
def index():
    return jsonify(
        {
            "message": "Resume Screening API is running",
            "health": "/api/health",
            "screen": "/api/screen",
            "candidates": "/api/candidates",
            "stats": "/api/stats",
        }
    )


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "resume-screening-api"})


@app.post("/api/screen")
def screen_resume():
    if "resume" not in request.files:
        return jsonify({"error": "resume file is required"}), 400

    file = request.files["resume"]
    if not file or file.filename == "":
        return jsonify({"error": "valid resume file is required"}), 400

    required_skills = request.form.get("required_skills", "")
    required_skills_list = [s.strip() for s in required_skills.split(",") if s.strip()]

    candidate_name = request.form.get("candidate_name", "Unknown Candidate").strip() or "Unknown Candidate"
    email = request.form.get("email", "").strip()

    try:
        content = file.read()
        resume_text = service.parse_resume(file.filename, content)
        analysis = service.analyze(resume_text, required_skills_list)

        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        save_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(save_path, "wb") as output:
            output.write(content)

        candidate_id = service.save_candidate(candidate_name, email, safe_filename, analysis)

        return jsonify(
            {
                "candidate_id": candidate_id,
                "candidate_name": candidate_name,
                "email": email,
                "analysis": analysis,
            }
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"failed to process resume: {exc}"}), 500


@app.get("/api/candidates")
def list_candidates():
    sort_by = request.args.get("sortBy", "ranking_score")
    order = request.args.get("order", "desc")
    candidates = service.fetch_candidates(sort_by=sort_by, order=order)
    return jsonify({"candidates": candidates})


@app.get("/api/candidates/export")
def export_candidates():
    candidates = service.fetch_candidates(sort_by="ranking_score", order="desc")

    output = io.StringIO()
    if candidates:
        fieldnames = list(candidates[0].keys())
    else:
        fieldnames = [
            "id",
            "candidate_name",
            "email",
            "resume_filename",
            "predicted_role",
            "predicted_category",
            "ranking_score",
            "matched_skills",
            "missing_skills",
            "created_at",
        ]

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in candidates:
        writer.writerow(row)

    mem = io.BytesIO(output.getvalue().encode("utf-8"))
    mem.seek(0)

    return send_file(
        mem,
        mimetype="text/csv",
        as_attachment=True,
        download_name="candidates_export.csv",
    )


@app.get("/api/stats")
def stats():
    return jsonify(service.stats())


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
