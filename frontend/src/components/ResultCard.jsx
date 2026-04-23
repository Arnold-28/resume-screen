export default function ResultCard({ title, value, subtitle }) {
  return (
    <article className="rounded-2xl bg-white/85 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-ocean">{title}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-ocean">{subtitle}</p> : null}
    </article>
  );
}
