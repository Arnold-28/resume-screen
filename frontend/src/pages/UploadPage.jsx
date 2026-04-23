import { useState } from "react";
import api from "../lib/api";
import Dropzone from "../components/Dropzone";
import ResultCard from "../components/ResultCard";

function TagList({ title, values, color }) {
  return (
    <section className="rounded-2xl bg-white/85 p-5 shadow-soft">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ocean">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.length ? (
          values.map((item) => (
            <span key={item} className={`rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-ocean">No items detected.</span>
        )}
      </div>
    </section>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }

    const form = new FormData();
    form.append("resume", file);
    form.append("candidate_name", candidateName);
    form.append("email", email);
    form.append("required_skills", requiredSkills);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/screen", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (err) {
      const msg = err.response?.data?.error || "Unable to reach screening API. Ensure backend is running on port 5000.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.analysis;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="rounded-3xl bg-sand/90 p-6 shadow-soft">
        <h2 className="font-display text-2xl font-bold text-ink">Candidate Screening</h2>
        <p className="mb-5 text-sm text-ocean">Upload resume, set expected skills, and get instant AI-backed screening.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Candidate name"
              className="rounded-xl border border-ocean/20 bg-white px-4 py-3"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="rounded-xl border border-ocean/20 bg-white px-4 py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <textarea
            placeholder="Required skills (comma separated): python, flask, sql"
            className="h-24 w-full rounded-xl border border-ocean/20 bg-white px-4 py-3"
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
          />

          <Dropzone file={file} setFile={setFile} />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-ink px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analyzing Resume..." : "Run Screening"}
          </button>

          {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
        </form>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultCard title="Predicted Role" value={analysis?.predicted_role || "--"} />
          <ResultCard title="Category" value={analysis?.predicted_category || "--"} />
          <ResultCard
            title="Ranking Score"
            value={analysis ? `${analysis.resume_ranking_score}%` : "--"}
            subtitle="Composite of skill match + model confidence"
          />
          <ResultCard title="Confidence" value={analysis ? `${analysis.confidence}%` : "--"} />
        </div>

        <TagList
          title="Matched Skills"
          values={analysis?.matched_skills || []}
          color="bg-mint text-ink"
        />
        <TagList
          title="Skill Gap Analysis (Missing)"
          values={analysis?.missing_skills || []}
          color="bg-coral/20 text-coral"
        />

        <section className="rounded-2xl bg-white/85 p-5 shadow-soft">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ocean">Role Recommendations</p>
          <div className="space-y-2">
            {(analysis?.recommended_roles || []).length ? (
              analysis.recommended_roles.map((item) => (
                <div key={item.role} className="flex items-center justify-between rounded-lg bg-sand px-3 py-2">
                  <span className="font-semibold text-ink">{item.role}</span>
                  <span className="font-bold text-ocean">{item.score}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ocean">Run screening to see recommendations.</p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
