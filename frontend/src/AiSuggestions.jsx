// src/AiSuggestions.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "./api";

export function AiSuggestionsModal({ open, onClose, date }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setText("");
    setError("");
    api
      .getAiSuggestions(date)
      .then((res) => setText(res.suggestions))
      .catch((e) => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [open, date]);

  if (!open) return null;

  // Render the modal into <body> so it isn't trapped behind any stacking contexts
  return createPortal(
    <div
      className="ai-overlay grid place-items-center p-4"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9998, // overlay below the card, above page content
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="solo-card w-full max-w-2xl p-6 space-y-4"
        style={{
          position: "relative",
          zIndex: 9999, // ensure the card sits above absolutely everything
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI Suggestions for {date}</h3>
          <button className="solo-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <p>Generating suggestions…</p>}
        {error && <p className="text-red-600">{String(error)}</p>}
        {!loading && !error && (
          <pre className="whitespace-pre-wrap leading-relaxed">{text}</pre>
        )}
      </div>
    </div>,
    document.body
  );
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function InlineAiButton({ date }) {
  const [open, setOpen] = React.useState(false);
  const dateIso = date || todayStr();

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
        className="solo-btn inline-flex select-none"
        aria-label="AI suggestion"
        style={{ cursor: "pointer" }} // clickable even if inside a disabled fieldset
      >
        AI suggestion
      </div>

      <AiSuggestionsModal
        open={open}
        onClose={() => setOpen(false)}
        date={dateIso}
      />
    </>
  );
}

export default function GlobalAiButton() {
  const [open, setOpen] = React.useState(false);
  const dateIso = todayStr();
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
        className="fixed bottom-6 right-6 solo-btn select-none"
        title="AI suggestion"
        style={{ cursor: "pointer" }}
      >
        AI suggestion
      </div>
      <AiSuggestionsModal
        open={open}
        onClose={() => setOpen(false)}
        date={dateIso}
      />
    </>
  );
}
