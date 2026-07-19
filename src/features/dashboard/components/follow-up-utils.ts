export type FollowUpStatus = "needs_attention" | "monitoring" | "improving" | "resolved";
export type FollowUpPriority = "low" | "medium" | "high";
export type DueFilter = "all" | "overdue" | "this_week" | "no_date";

export function localDateKey(now = new Date()) {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function dueMatches(dueDate: string | null, filter: DueFilter, now = new Date()) {
  if (filter === "all") return true;
  if (filter === "no_date") return !dueDate;
  if (!dueDate) return false;
  const today = localDateKey(now);
  if (filter === "overdue") return dueDate < today;
  const end = new Date(`${today}T00:00:00`);
  end.setDate(end.getDate() + 7);
  return dueDate >= today && dueDate <= localDateKey(end);
}
