import type { ClassPulse } from "@/features/dashboard/types";

export function pulseColor(value: ClassPulse["understanding"]) {
  return value === "strong" ? "#2a9d73" : value === "mixed" ? "#dc9a1b" : "#d9534f";
}

export function pulseLabel(value: ClassPulse["understanding"]) {
  return value === "strong" ? "Lancar" : value === "mixed" ? "Bercampur" : "Perlu bantuan";
}
