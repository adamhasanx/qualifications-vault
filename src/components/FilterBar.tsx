"use client";

import { SortKey, StatusFilter } from "../types";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "expiry", label: "Soonest expiring" },
  { key: "issueDate", label: "Issue date" },
  { key: "courseName", label: "Course name" },
  { key: "level", label: "Level" },
  { key: "az", label: "A–Z" },
];

export default function FilterBar({
  sortKey,
  onSortChange,
  statusFilter,
  onStatusChange,
  activeCount,
  expiredCount,
}: {
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  activeCount: number;
  expiredCount: number;
}) {
  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: activeCount + expiredCount },
    { key: "active", label: "Active", count: activeCount },
    { key: "expired", label: "Expired", count: expiredCount },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 bg-surface rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onStatusChange(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              statusFilter === tab.key ? "bg-white text-ink shadow-card" : "text-muted hover:text-ink"
            }`}
          >
            {tab.label} <span className="opacity-60">{tab.count}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted">Sort by</span>
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-xl border border-surface2 bg-white px-3 py-2 font-medium text-ink focus:outline-none focus:ring-2 focus:ring-blue"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
