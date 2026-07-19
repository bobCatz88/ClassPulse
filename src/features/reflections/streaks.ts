function zonedDateKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addCivilDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function weeklyReflectionCount(recordedAt: string[], now = new Date(), timeZone = "Asia/Kuala_Lumpur") {
  const currentDay = zonedDateKey(now, timeZone);
  const [year, month, day] = currentDay.split("-").map(Number);
  const start = addCivilDays(currentDay, -new Date(Date.UTC(year, month - 1, day)).getUTCDay());
  const end = addCivilDays(start, 7);
  return recordedAt.filter((value) => {
    const date = zonedDateKey(new Date(value), timeZone);
    return date >= start && date < end;
  }).length;
}

export function reflectionDayStreak(recordedAt: string[], now = new Date(), timeZone = "Asia/Kuala_Lumpur") {
  const days = new Set(recordedAt.map((value) => zonedDateKey(new Date(value), timeZone)));
  let cursor = zonedDateKey(now, timeZone);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addCivilDays(cursor, -1);
  }
  return streak;
}
