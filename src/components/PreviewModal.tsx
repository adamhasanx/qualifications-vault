"use client";

import { Qualification } from "../types";

export default function PreviewModal({ qualification, onClose }: { qualification: Qualification; onClose: () => void }) {
  const isPdf = qualification.fileType === "application/pdf";
  const fileSrc = `/api/files/${qualification.id}`;

  return (
    <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-soft w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface2">
          <div>
            <p className="font-bold text-ink">{qualification.courseName}</p>
            <p className="text-sm text-muted">{qualification.issuer}</p>
          </div>
          <button onClick={onClose} className="rounded-full h-9 w-9 flex items-center justify-center hover:bg-surface transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-surface p-4">
          {isPdf ? (
            <iframe src={fileSrc} className="w-full h-[65vh] rounded-xl bg-white" title="Certificate preview" />
          ) : (
            <img src={fileSrc} alt={qualification.courseName} className="w-full h-auto rounded-xl mx-auto" />
          )}
        </div>
      </div>
    </div>
  );
}
