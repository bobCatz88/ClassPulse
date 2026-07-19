"use client";

import { useState } from "react";

import type { ClassRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import type { FollowUpPriority } from "./follow-up-utils";

export type FollowUpDraft = { classId?: string; reflectionId?: string; observation?: string };

export function FollowUpFormPanel({ classes, draft, onDone }: { classes: ClassRecord[]; draft?: FollowUpDraft; onDone: () => void }) {
  const initialClassId = draft?.classId && classes.some((item) => item.id === draft.classId) ? draft.classId : classes[0]?.id ?? "";
  const [classId, setClassId] = useState(initialClassId);
  const [studentId, setStudentId] = useState(classes.find((item) => item.id === initialClassId)?.students[0]?.id ?? "");
  const [observation, setObservation] = useState(draft?.observation ?? "");
  const [evidence, setEvidence] = useState("");
  const [priority, setPriority] = useState<FollowUpPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [notice, setNotice] = useState("");
  const selected = classes.find((item) => item.id === classId);

  async function save() {
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !classId || !studentId || !observation.trim()) { setNotice("Lengkapkan kelas, murid dan pemerhatian."); return; }
    const { error } = await supabase.from("student_follow_ups").insert({ teacher_id: auth.user.id, class_id: classId, student_id: studentId, reflection_id: draft?.reflectionId ?? null, observation: observation.trim(), evidence: evidence.trim() || null, priority, due_date: dueDate || null });
    if (error) { setNotice("Susulan tidak dapat disimpan."); return; }
    setObservation(draft?.observation ?? ""); setEvidence(""); setDueDate(""); setNotice(""); onDone();
  }

  return <section className="settings-card follow-up-form"><h3>Tambah susulan murid</h3><p className="muted-copy">Nyatakan pemerhatian dan bukti, bukan andaian tentang murid.</p><div className="two-fields"><label className="form-field"><span>Kelas</span><select value={classId} onChange={(event) => { const nextClassId = event.target.value; setClassId(nextClassId); setStudentId(classes.find((item) => item.id === nextClassId)?.students[0]?.id ?? ""); }}><option value="">Pilih kelas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_name}</option>)}</select></label><label className="form-field"><span>Murid</span><select value={studentId} disabled={!selected?.students.length} onChange={(event) => setStudentId(event.target.value)}><option value="">Pilih murid</option>{selected?.students.map((student) => <option key={student.id} value={student.id}>{student.display_name}</option>)}</select></label></div><label className="form-field"><span>Pemerhatian</span><textarea rows={3} value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Contoh: Masih perlukan bantuan membandingkan pecahan." /></label><label className="form-field"><span>Bukti (pilihan)</span><textarea rows={2} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Contoh: 3 daripada 5 jawapan latihan perlu dibetulkan." /></label><div className="two-fields"><label className="form-field"><span>Keutamaan</span><select value={priority} onChange={(event) => setPriority(event.target.value as FollowUpPriority)}><option value="low">Rendah</option><option value="medium">Sederhana</option><option value="high">Tinggi</option></select></label><label className="form-field"><span>Tarikh semakan (pilihan)</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div><button className="primary-button" disabled={!classes.length} onClick={() => void save()}>Simpan susulan</button>{notice && <p className="workflow-notice">{notice}</p>}</section>;
}
