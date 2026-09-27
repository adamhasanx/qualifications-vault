"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { Qualification, SortKey, StatusFilter, getStatus } from "@/types";
import FilterBar from "./FilterBar";
import QualificationCard from "./QualificationCard";
import UploadModal from "./UploadModal";
import PreviewModal from "./PreviewModal";

export default function Dashboard({ userName, userImage }: { userName: string; userImage: string | null }) {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("expiry");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [previewing, setPreviewing] = useState<Qualification | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/qualifications");
    const data = await res.json();
    setQualifications(data.qualifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    let list = [...qualifications];
    if (statusFilter !== "all") {
      list = list.filter((q) => (statusFilter === "active" ? getStatus(q) !== "expired" : getStatus(q) === "expired"));
    }
    const byExpirySoonest = (a: Qualification, b: Qualification) => {
      const aTime = a.neverExpires || !a.expiryDate ? Infinity : new Date(a.expiryDate).getTime();
      const bTime = b.neverExpires || !b.expiryDate ? Infinity : new Date(b.expiryDate).getTime();
      return aTime - bTime;
    };
    switch (sortKey) {
      case "expiry":
        list.sort(byExpirySoonest);
        break;
      case "issueDate":
        list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
        break;
      case "courseName":
      case "az":
        list.sort((a, b) => a.courseName.localeCompare(b.courseName));
        break;
      case "level":
        list.sort((a, b) => (a.level ?? "").localeCompare(b.level ?? ""));
        break;
    }
    return list;
  }, [qualifications, sortKey, statusFilter]);

  const activeCount = qualifications.filter((q) => getStatus(q) !== "expired").length;
  const expiredCount = qualifications.length - activeCount;

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-surface2 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-lilac to-blue flex items-center justify-center shadow-soft shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.5 7 7.5 1-5.5 5.2 1.4 7.3L12 18.8 5.1 22.5l1.4-7.3L1 10l7.5-1L12 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-ink leading-none">Qualifications Vault</p>
            <p className="text-xs text-muted mt-1">Welcome back, {userName.split(" ")[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-xl bg-blue text-white px-4 py-2.5 font-semibold text-sm shadow-soft hover:bg-blue-deep transition-colors"
          >
            + Add qualification
          </button>
          {userImage ? (
            <img src={userImage} alt="" className="h-10 w-10 rounded-full border-2 border-white shadow-soft" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-surface2" />
          )}
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-muted hover:text-ink transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        <FilterBar
          sortKey={sortKey}
          onSortChange={setSortKey}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          activeCount={activeCount}
          expiredCount={expiredCount}
        />

        {loading ? (
          <div className="mt-16 text-center text-muted">Loading your vault…</div>
        ) : sorted.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg font-semibold text-ink">No certificates here yet</p>
            <p className="text-muted mt-1">Add your first one — we'll fill in the details for you.</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-5 rounded-xl bg-blue text-white px-5 py-3 font-semibold text-sm shadow-soft"
            >
              + Add qualification
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((q) => (
              <QualificationCard
                key={q.id}
                qualification={q}
                onPreview={() => setPreviewing(q)}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onCreated={() => {
            setShowUpload(false);
            load();
          }}
        />
      )}

      {previewing && <PreviewModal qualification={previewing} onClose={() => setPreviewing(null)} />}
    </main>
  );
}
