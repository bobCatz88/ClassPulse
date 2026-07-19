"use client";

import { useState } from "react";
import type { ClassRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

export function FollowUpForm({ classes, onDone }: { classes: ClassRecord[]; onDone: () => void }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [studentId, setStudentId] = useState(classes[0]?.students[0]?.id ?? "");
  const [observation, setObservation] = useState("");
  const [evidence, setEvidence] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [notice, setNotice] = useState("");
  const selected = classes.find((item) => item.id === classId);
  async function save() {
    const { data: auth } = await createSupabaseBrowserClient().auth.getUser();
    if (!auth.user || !classId || !studentId || !observation.trim()) return setNotice("Lengkapkan kelas, murid dan pemerhatian.");
    const { error } = await createSupabaseBrowserClient().from("student_follow_ups").insert({ teacher_id: auth.user.id, class_id: classId, student_id: studentId, observation: observation.trim(), evidence: evidence.trim() || null, priority });
    if (error) return setNotice("Susulan tidak dapat disimpan.");
    onDone();
  }
  return <section className="settings-card"><h3>Tambah susulan murid</h3><label className="form-field"><span>Kelas</span><select value={classId} onChange={(event) => { setClassId(event.target.value); setStudentId(classes.find((item) => item.id === event.target.value)?.students[0]?.id ?? ""); }}>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_name}</option>)}</select></label><label className="form-field"><span>Murid</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{selected?.students.map((student) => <option key={student.id} value={student.id}>{student.display_name}</option>)}</select></label><label className="form-field"><span>Pemerhatian</span><textarea value={observation} onChange={(event) => setObservation(event.target.value)} /></label><label className="form-field"><span>Bukti</span><textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} /></label><label className="form-field"><span>Keutamaan</span><select value={priority} onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")}><option value="low">Rendah</option><option value="medium">Sederhana</option><option value="high">Tinggi</option></select></label><button className="primary-button" onClick={() => void save()}>Simpan susulan</button>{notice && <p className="workflow-notice">{notice}</p>}</section>;
}
