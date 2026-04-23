import { NavLink, Route, Routes } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import AdminPage from "./pages/AdminPage";

const navClass = ({ isActive }) =>
  `px-4 py-2 rounded-full font-semibold transition ${
    isActive ? "bg-ink text-white" : "bg-white/70 text-ink hover:bg-white"
  }`;

export default function App() {
  return (
    <div className="min-h-screen px-4 py-6 md:px-12">
      <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white/70 p-5 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Resume Screening System</h1>
          <p className="text-sm text-ocean">Decision Tree powered ranking, recommendations, and admin analytics.</p>
        </div>
        <nav className="flex gap-2">
          <NavLink to="/" className={navClass} end>
            Candidate Dashboard
          </NavLink>
          <NavLink to="/admin" className={navClass}>
            Admin Panel
          </NavLink>
        </nav>
      </header>

      <main className="animate-rise">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}
