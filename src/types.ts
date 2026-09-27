export type Qualification = {
  id: string;
  courseName: string;
  issuer: string;
  level: string | null;
  issueDate: string;
  expiryDate: string | null;
  neverExpires: boolean;
  fileUrl: string;
  fileType: string;
  createdAt: string;
};

export type SortKey = "expiry" | "issueDate" | "courseName" | "level" | "az";
export type StatusFilter = "all" | "active" | "expired";

export function getStatus(q: Qualification): "expired" | "expiring" | "active" {
  if (q.neverExpires || !q.expiryDate) return "active";
  const expiry = new Date(q.expiryDate).getTime();
  const now = Date.now();
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
  if (expiry < now) return "expired";
  if (expiry - now < THIRTY_DAYS) return "expiring";
  return "active";
}
