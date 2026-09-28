"use client";

import { useState } from "react";
import { Qualification, getStatus } from "../types";

const STATUS_STYLES = {
  active: { dot: "bg-valid", badge: "bg-valid-soft text-valid", label: "Active" },
  expiring: { dot: "bg-warn", badge: "bg-warn-soft text-warn", label: "Expiring soon" },
  expired: { dot: "bg-danger", badge: "bg-danger-soft text-danger", label: "Expired" },
} as const;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function QualificationCard({
  qualification,
  onPreview,
  onChanged,
}: {
  qualification: Qualification;
  onPreview: () => void;
  onChanged: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const status = getStatus(qualification);
  const style = STATUS_STYLES[status];

  async function handleDelete() {
    if (!confirm(`Remove "${qualification.courseName}"?`)) return;
    setDeleting(true);
    await fetch(`/api/qualifications/${qualification.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="relative rounded-2xl bg-white border border-surface2 shadow-card p-5 flex flex-col gap-3">
      <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-full ${style.dot}`} />
      <div className="pl-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-ink leading-snug truncate">{qualification.courseName}</p>
          <p className="text-sm text-muted truncate">{qualification.issuer}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      <div className="pl-2 grid grid-cols-2 gap-2 text-sm">
        {qualification.level && (
          <div className="col-span-2">
            <p className="text-muted text-xs">Level</p>
            <p className="text-ink font-medium">{qualification.level}</p>
          </div>
        )}
        <div>
          <p className="text-muted text-xs">Issued</p>
          <p className="text-ink font-medium">{formatDate(qualification.issueDate)}</p>
        </div>
        <div>
          <p className="text-muted text-xs">Expires</p>
          <p className="text-ink font-medium">{qualification.neverExpires ? "Never" : formatDate(qualification.expiryDate)}</p>
        </div>
      </div>

      <div className="pl-2 mt-1 flex items-center gap-2">
        <button
          onClick={onPreview}
          className="flex-1 rounded-xl bg-surface text-ink text-sm font-semibold py-2 hover:bg-surface2 transition-colors"
        >
          Preview
        </button>
        <button
          disabled
          title="Sharing is coming soon"
          className="flex-1 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold py-2 cursor-not-allowed"
        >
          Share
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Remove"
          className="rounded-xl border border-surface2 text-muted hover:text-danger hover:border-danger/30 px-2.5 py-2 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
