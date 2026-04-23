import io
import os
import re
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import pandas as pd
from PyPDF2 import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier


KNOWN_SKILLS = {
    "python",
    "java",
    "c",
    "c++",
    "javascript",
    "typescript",
    "react",
    "flask",
    "django",
    "node",
    "express",
    "sql",
    "mongodb",
    "postgresql",
    "pandas",
    "numpy",
    "scikit-learn",
    "machine learning",
    "deep learning",
    "nlp",
    "tensorflow",
    "pytorch",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "git",
    "github",
    "ci",
    "cd",
    "jenkins",
    "selenium",
    "tableau",
    "powerbi",
    "excel",
    "spark",
    "airflow",
    "linux",
    "rest",
    "api",
    "css",
    "html",
    "bootstrap",
    "tailwind",
}


class ResumeScreeningService:
    def __init__(self, data_path: str, db_path: str):
        self.data_path = data_path
        self.db_path = db_path

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", min_df=1)
        self.role_model = DecisionTreeClassifier(max_depth=10, random_state=42)
        self.category_model = DecisionTreeClassifier(max_depth=10, random_state=42)

        self.role_labels: List[str] = []
        self.category_labels: List[str] = []

        self._init_db()
        self._train_models()

    def _init_db(self) -> None:
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_name TEXT,
                    email TEXT,
                    resume_filename TEXT,
                    predicted_role TEXT,
                    predicted_category TEXT,
                    ranking_score REAL,
                    matched_skills TEXT,
                    missing_skills TEXT,
                    created_at TEXT
                )
                """
            )
            conn.commit()

    def _train_models(self) -> None:
        df = pd.read_csv(self.data_path)
        df["text"] = df["text"].fillna("").str.lower()

        X = self.vectorizer.fit_transform(df["text"])
        y_role = df["job_role"]
        y_category = df["candidate_category"]

        self.role_labels = sorted(y_role.unique().tolist())
        self.category_labels = sorted(y_category.unique().tolist())

        X_train_r, _, y_train_r, _ = train_test_split(X, y_role, test_size=0.2, random_state=42)
        X_train_c, _, y_train_c, _ = train_test_split(X, y_category, test_size=0.2, random_state=42)

        self.role_model.fit(X_train_r, y_train_r)
        self.category_model.fit(X_train_c, y_train_c)

    def parse_resume(self, file_name: str, content: bytes) -> str:
        extension = os.path.splitext(file_name)[1].lower()
        if extension == ".txt":
            return content.decode("utf-8", errors="ignore")
        if extension == ".pdf":
            reader = PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages)
        raise ValueError("Only .pdf and .txt resumes are supported")

    def normalize_text(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r"[^a-z0-9+#\\s]", " ", text)
        text = re.sub(r"\\s+", " ", text).strip()
        return text

    def extract_skills(self, text: str) -> List[str]:
        normalized = self.normalize_text(text)
        matched = []
        for skill in KNOWN_SKILLS:
            if f" {skill} " in f" {normalized} ":
                matched.append(skill)
        return sorted(set(matched))

    def _predict_role_probabilities(self, normalized_text: str) -> List[Tuple[str, float]]:
        vec = self.vectorizer.transform([normalized_text])
        probabilities = self.role_model.predict_proba(vec)[0]
        classes = self.role_model.classes_
        ranked = sorted(zip(classes, probabilities), key=lambda x: x[1], reverse=True)
        return [(str(role), float(prob)) for role, prob in ranked]

    def analyze(self, resume_text: str, required_skills: Optional[List[str]] = None) -> Dict:
        required_skills = [s.strip().lower() for s in (required_skills or []) if s.strip()]

        normalized = self.normalize_text(resume_text)
        vec = self.vectorizer.transform([normalized])

        role_prediction = self.role_model.predict(vec)[0]
        category_prediction = self.category_model.predict(vec)[0]

        role_probs = self._predict_role_probabilities(normalized)
        confidence = role_probs[0][1] if role_probs else 0.0

        extracted_skills = self.extract_skills(normalized)
        matched_skills = sorted(set(required_skills).intersection(extracted_skills)) if required_skills else extracted_skills
        missing_skills = sorted(set(required_skills) - set(extracted_skills)) if required_skills else []

        if required_skills:
            skill_score = (len(matched_skills) / len(required_skills)) * 100
        else:
            skill_score = min(len(extracted_skills) * 6, 100)

        ranking_score = round((0.7 * skill_score) + (0.3 * confidence * 100), 2)

        recommendations = [
            {"role": role, "score": round(prob * 100, 2)}
            for role, prob in role_probs[:3]
        ]

        return {
            "predicted_role": str(role_prediction),
            "predicted_category": str(category_prediction),
            "confidence": round(confidence * 100, 2),
            "resume_ranking_score": ranking_score,
            "extracted_skills": extracted_skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "recommended_roles": recommendations,
        }

    def save_candidate(
        self,
        candidate_name: str,
        email: str,
        resume_filename: str,
        analysis: Dict,
    ) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO candidates (
                    candidate_name,
                    email,
                    resume_filename,
                    predicted_role,
                    predicted_category,
                    ranking_score,
                    matched_skills,
                    missing_skills,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    candidate_name,
                    email,
                    resume_filename,
                    analysis["predicted_role"],
                    analysis["predicted_category"],
                    analysis["resume_ranking_score"],
                    ", ".join(analysis["matched_skills"]),
                    ", ".join(analysis["missing_skills"]),
                    datetime.utcnow().isoformat(timespec="seconds"),
                ),
            )
            conn.commit()
            return int(cursor.lastrowid)

    def fetch_candidates(self, sort_by: str = "ranking_score", order: str = "desc") -> List[Dict]:
        allowed_columns = {
            "id",
            "candidate_name",
            "email",
            "predicted_role",
            "predicted_category",
            "ranking_score",
            "created_at",
        }
        if sort_by not in allowed_columns:
            sort_by = "ranking_score"
        sort_order = "DESC" if order.lower() == "desc" else "ASC"

        query = f"""
            SELECT
                id,
                candidate_name,
                email,
                resume_filename,
                predicted_role,
                predicted_category,
                ranking_score,
                matched_skills,
                missing_skills,
                created_at
            FROM candidates
            ORDER BY {sort_by} {sort_order}
        """

        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query).fetchall()

        return [dict(row) for row in rows]

    def stats(self) -> Dict:
        with sqlite3.connect(self.db_path) as conn:
            total = conn.execute("SELECT COUNT(*) FROM candidates").fetchone()[0]
            avg_score = conn.execute("SELECT AVG(ranking_score) FROM candidates").fetchone()[0] or 0
            top_role = conn.execute(
                """
                SELECT predicted_role, COUNT(*) AS c
                FROM candidates
                GROUP BY predicted_role
                ORDER BY c DESC
                LIMIT 1
                """
            ).fetchone()

        return {
            "total_candidates": int(total),
            "average_score": round(float(avg_score), 2),
            "top_role": top_role[0] if top_role else None,
        }
