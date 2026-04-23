import { useRef } from "react";

export default function Dropzone({ file, setFile }) {
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="card-grid rounded-2xl border-2 border-dashed border-ocean/40 bg-white/85 p-8 text-center"
    >
      <p className="mb-2 font-display text-lg font-bold text-ink">Drag and Drop Resume</p>
      <p className="mb-5 text-sm text-ocean">Upload PDF or TXT resume for screening</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-xl bg-coral px-5 py-2 font-semibold text-white transition hover:brightness-95"
      >
        Browse Resume
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {file ? <p className="mt-4 text-sm font-semibold text-ink">Selected: {file.name}</p> : null}
    </div>
  );
}
