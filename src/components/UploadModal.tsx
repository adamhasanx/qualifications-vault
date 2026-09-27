"use client";

import { useRef, useState } from "react";

type Stage = "pick" | "reading" | "confirm" | "saving";

type FormState = {
  courseName: string;
  issuer: string;
  level: string;
  issueDate: string;
  expiryDate: string;
  neverExpires: boolean;
};

const EMPTY_FORM: FormState = {
  courseName: "",
  issuer: "",
  level: "",
  issueDate: "",
  expiryDate: "",
  neverExpires: false,
};

export default function UploadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setStage("reading");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setFileUrl(data.fileUrl);
      setFileType(data.fileType);

      if (data.parseError) {
        setNotice("We saved your file, but couldn't auto-read it — fill the details in manually.");
      } else if (data.parsed?.confidence === "low") {
        setNotice("We took a first pass at reading this one — double check the details below.");
      }

      const p = data.parsed ?? {};
      setForm({
        courseName: p.courseName ?? "",
        issuer: p.issuer ?? "",
        level: p.level ?? "",
        issueDate: p.issueDate ?? "",
        expiryDate: p.expiryDate ?? "",
        neverExpires: !!p.neverExpires,
      });
      setStage("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("pick");
    }
  }

  async function handleSave() {
    if (!fileUrl || !fileType) return;
    if (!form.courseName || !form.issuer || !form.issueDate) {
      setError("Course name, issuer and issue date are required.");
      return;
    }
    setError(null);
    setStage("saving");
    const res = await fetch("/api/qualifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fileUrl, fileType }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Couldn't save this qualification.");
      setStage("confirm");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-soft w-full max-w-lg max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface2 sticky top-0 bg-white rounded-t-3xl">
          <p className="font-bold text-ink">Add a qualification</p>
          <button onClick={onClose} className="rounded-full h-9 w-9 flex items-center justify-center hover:bg-surface transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 rounded-xl bg-danger-soft text-danger text-sm px-4 py-3">{error}</div>}
          {notice && stage === "confirm" && (
            <div className="mb-4 rounded-xl bg-warn-soft text-warn text-sm px-4 py-3">{notice}</div>
          )}

          {stage === "pick" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => inputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                dragOver ? "border-blue bg-blue-soft" : "border-surface2 bg-surface"
              }`}
            >
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-white shadow-card flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4C6FE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
              </div>
              <p className="font-semibold text-ink">Drop a PDF or image here</p>
              <p className="text-sm text-muted mt-1">or click to browse — we'll read the details for you</p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {stage === "reading" && (
            <div className="py-14 text-center">
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-surface2 border-t-blue animate-spin" />
              <p className="mt-4 font-medium text-ink">Reading your certificate…</p>
              <p className="text-sm text-muted mt-1">This usually takes a few seconds.</p>
            </div>
          )}

          {(stage === "confirm" || stage === "saving") && (
            <div className="space-y-4">
              <Field label="Course name" required>
                <input
                  value={form.courseName}
                  onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  className="input"
                  placeholder="e.g. First Aid at Work"
                />
              </Field>
              <Field label="Issuer" required>
                <input
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  className="input"
                  placeholder="e.g. Red Cross"
                />
              </Field>
              <Field label="Level">
                <input
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="input"
                  placeholder="e.g. Level 2"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Issue date" required>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Expiry date">
                  <input
                    type="date"
                    value={form.expiryDate}
                    disabled={form.neverExpires}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="input disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.neverExpires}
                  onChange={(e) => setForm({ ...form, neverExpires: e.target.checked, expiryDate: "" })}
                  className="h-4 w-4 rounded accent-blue"
                />
                <span className="text-sm font-medium text-ink">This qualification does not expire</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setStage("pick")}
                  className="rounded-xl border border-surface2 text-ink font-semibold px-4 py-2.5 text-sm hover:bg-surface transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={stage === "saving"}
                  className="flex-1 rounded-xl bg-blue text-white font-semibold px-4 py-2.5 text-sm shadow-soft hover:bg-blue-deep transition-colors disabled:opacity-60"
                >
                  {stage === "saving" ? "Saving…" : "Save qualification"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.875rem;
          border: 1px solid #efeafa;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.9rem;
          color: #1f2430;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #4c6fe7;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
