"use client";

import { useEffect, useMemo, useState } from "react";

import type { ClassRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import { dueMatches, type DueFilter, type FollowUpPriority, type FollowUpStatus } from "./follow-up-utils";

import "./follow-up-panel.css";
type Relation = { display_name?: string; class_name?: string };
type FollowUp = { id: string; class_id: string; observation: string; evidence: string | null; priority: FollowUpPriority; status: FollowUpStatus; due_date: string | null; students: Relation | Relation[] | null; classes: Relation | Relation[] | null };
const columns: Array<[FollowUpStatus, string]> = [["needs_attention", "Perlu perhatian"], ["monitoring", "Dipantau"], ["improving", "Semakin baik"], ["resolved", "Selesai"]];

function relationName(relation: Relation | Relation[] | null, key: "display_name" | "class_name") {
  const value = Array.isArray(relation) ? relation[0] : relation;
  return value?.[key] || "Tidak diketahui";
}

export function FollowUpBoardPanel({ classes, refreshKey }: { classes: ClassRecord[]; refreshKey: number }) {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [notice, setNotice] = useState("");
  const [classId, setClassId] = useState("all");
  const [priority, setPriority] = useState<"all" | FollowUpPriority>("all");
  const [due, setDue] = useState<DueFilter>("all");

  useEffect(() => {
    let active = true;
    void createSupabaseBrowserClient().from("student_follow_ups").select("id, class_id, observation, evidence, priority, status, due_date, students(display_name), classes(class_name)").order("updated_at", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) { setNotice("Susulan tidak dapat dimuatkan."); return; }
      setNotice("");
      setItems((data ?? []) as unknown as FollowUp[]);
    });
    return () => { active = false; };
  }, [refreshKey]);

  const filtered = useMemo(() => items.filter((item) => (classId === "all" || item.class_id === classId) && (priority === "all" || item.priority === priority) && dueMatches(item.due_date, due)), [classId, due, items, priority]);

  async function move(item: FollowUp, status: FollowUpStatus) {
    const resolved_at = status === "resolved" ? new Date().toISOString() : null;
    const { error } = await createSupabaseBrowserClient().from("student_follow_ups").update({ status, resolved_at }).eq("id", item.id);
    if (error) { setNotice("Status tidak dapat dikemas kini."); return; }
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, status } : row));
  }

  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">SUSULAN BERASASKAN BUKTI</span><h2>Papan susulan murid</h2><p>Rekod pemerhatian dan tindakan, tanpa melabel murid.</p></div></div>
    <div className="follow-up-filters"><label>Kelas<select value={classId} onChange={(event) => setClassId(event.target.value)}><option value="all">Semua kelas</option>{classes.map((item) => <option value={item.id} key={item.id}>{item.class_name}</option>)}</select></label><label>Keutamaan<select value={priority} onChange={(event) => setPriority(event.target.value as "all" | FollowUpPriority)}><option value="all">Semua</option><option value="high">Tinggi</option><option value="medium">Sederhana</option><option value="low">Rendah</option></select></label><label>Tarikh<select value={due} onChange={(event) => setDue(event.target.value as DueFilter)}><option value="all">Semua</option><option value="overdue">Tertunggak</option><option value="this_week">7 hari ini</option><option value="no_date">Tiada tarikh</option></select></label></div>
    {notice && <p className="workflow-notice">{notice}</p>}<div className="follow-up-board">{columns.map(([status, label]) => <section className="follow-up-column" key={status}><h3>{label}</h3>{filtered.filter((item) => item.status === status).map((item) => <article className="memory-card" key={item.id}><span className="eyebrow">{relationName(item.classes, "class_name")} · {relationName(item.students, "display_name")}</span><h4>{item.observation}</h4>{item.evidence && <p>{item.evidence}</p>}<small>Keutamaan: {item.priority}{item.due_date ? ` · Sebelum ${item.due_date}` : ""}</small><select aria-label={`Status ${item.observation}`} value={item.status} onChange={(event) => void move(item, event.target.value as FollowUpStatus)}>{columns.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></article>)}{!filtered.some((item) => item.status === status) && <p className="muted-copy">Tiada item.</p>}</section>)}</div>
  </section>;
}
