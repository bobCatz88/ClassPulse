"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

type FollowUp = { id: string; observation: string; evidence: string | null; priority: "low" | "medium" | "high"; status: "needs_attention" | "monitoring" | "improving" | "resolved"; due_date: string | null; students: any; classes: any };
 
const columns: Array<[FollowUp["status"], string]> = [["needs_attention", "Perlu perhatian"], ["monitoring", "Dipantau"], ["improving", "Semakin baik"], ["resolved", "Selesai"]];

export function FollowUpBoard() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [notice, setNotice] = useState("");
  async function load() {
    const { data, error } = await createSupabaseBrowserClient().from("student_follow_ups").select("id, observation, evidence, priority, status, due_date, students(display_name), classes(class_name)").order("updated_at", { ascending: false });
    if (error) setNotice("Susulan tidak dapat dimuatkan."); else setItems((data ?? []) as FollowUp[]);
  }
  useEffect(() => { void load(); }, []);
   
  async function move(item: FollowUp, status: FollowUp["status"]) {
    const resolved_at = status === "resolved" ? new Date().toISOString() : null;
    const { error } = await createSupabaseBrowserClient().from("student_follow_ups").update({ status, resolved_at }).eq("id", item.id);
    if (error) return setNotice("Status tidak dapat dikemas kini.");
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, status } : row));
  }
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">SUSULAN BERASASKAN BUKTI</span><h2>Papan susulan murid</h2><p>Rekod pemerhatian dan tindakan, tanpa melabel murid.</p></div></div>{notice && <p className="workflow-notice">{notice}</p>}<div className="follow-up-board">{columns.map(([status, label]) => <section className="follow-up-column" key={status}><h3>{label}</h3>{items.filter((item) => item.status === status).map((item) => <article className="memory-card" key={item.id}><span className="eyebrow">{item.classes?.class_name} · {item.students?.display_name}</span><h4>{item.observation}</h4>{item.evidence && <p>{item.evidence}</p>}<small>Keutamaan: {item.priority}{item.due_date ? ` · Sebelum ${item.due_date}` : ""}</small><select value={item.status} onChange={(event) => void move(item, event.target.value as FollowUp["status"])}>{columns.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></article>)}{!items.some((item) => item.status === status) && <p className="muted-copy">Tiada item.</p>}</section>)}</div></section>;
}
