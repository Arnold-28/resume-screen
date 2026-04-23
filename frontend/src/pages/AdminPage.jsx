import { useEffect, useState } from "react";
import api from "../lib/api";
import ResultCard from "../components/ResultCard";

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [sortBy, setSortBy] = useState("ranking_score");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, candidateRes] = await Promise.all([
        api.get("/stats"),
        api.get(`/candidates?sortBy=${sortBy}&order=${order}`),
      ]);
      setStats(statsRes.data);
      setCandidates(candidateRes.data.candidates || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sortBy, order]);

  const handleExport = () => {
    const base = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";
    window.open(`${base}/candidates/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <ResultCard title="Total Candidates" value={stats?.total_candidates ?? 0} />
        <ResultCard title="Average Score" value={`${stats?.average_score ?? 0}%`} />
        <ResultCard title="Top Job Role" value={stats?.top_role || "--"} />
      </section>

      <section className="rounded-3xl bg-white/85 p-6 shadow-soft">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Candidate Admin Panel</h2>
          <div className="flex gap-2">
            <select
              className="rounded-lg border border-ocean/30 px-3 py-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="ranking_score">Sort: Score</option>
              <option value="candidate_name">Sort: Name</option>
              <option value="predicted_role">Sort: Role</option>
              <option value="created_at">Sort: Date</option>
            </select>
            <select
              className="rounded-lg border border-ocean/30 px-3 py-2"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button
              onClick={handleExport}
              className="rounded-lg bg-ink px-4 py-2 font-semibold text-white"
              type="button"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-ocean">
                <th className="px-3">Name</th>
                <th className="px-3">Email</th>
                <th className="px-3">Role</th>
                <th className="px-3">Category</th>
                <th className="px-3">Score</th>
                <th className="px-3">Matched Skills</th>
                <th className="px-3">Missing Skills</th>
                <th className="px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-ocean" colSpan="8">
                    Loading candidates...
                  </td>
                </tr>
              ) : candidates.length ? (
                candidates.map((row) => (
                  <tr key={row.id} className="rounded-xl bg-sand/70 text-ink">
                    <td className="px-3 py-3 font-semibold">{row.candidate_name}</td>
                    <td className="px-3 py-3">{row.email || "--"}</td>
                    <td className="px-3 py-3">{row.predicted_role}</td>
                    <td className="px-3 py-3">{row.predicted_category}</td>
                    <td className="px-3 py-3 font-bold">{row.ranking_score}%</td>
                    <td className="px-3 py-3">{row.matched_skills || "--"}</td>
                    <td className="px-3 py-3">{row.missing_skills || "--"}</td>
                    <td className="px-3 py-3">{row.created_at}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-ocean" colSpan="8">
                    No candidates screened yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
