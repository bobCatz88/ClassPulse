"use client";

import { useState } from "react";
import type { ClassRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

type Props = { item?: ClassRecord | null; onClose: () => void; onSaved: (item: ClassRecord) => void; onDeleted: (id: string) => void };

export function ClassManager({ item, onClose, onSaved, onDeleted }: Props) {
  const [name, setName] = useState(item?.class_name || "");
  const [year, setYear] = useState(item?.year_level || "");
  const [subject, setSubject] = useState(item?.subject || "");
  const [newStudents, setNewStudents] = useState("");
  const [students, setStudents] = useState(item?.students || []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  function removeStudent(id: string) {
    setStudents((current) => current.filter((student) => student.id !== id));
    if (!id.startsWith("new-")) setRemoved((current) => [...current, id]);
  }

  async function save() {
    if (!name.trim() || !year.trim() || !subject.trim()) return setNotice("Nama kelas, tahun dan subjek diperlukan.");
    setBusy(true); setNotice("");
    const supabase = createSupabaseBrowserClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sesi tamat. Log masuk semula.");
      let classId = item?.id;
      let createdAt = item?.created_at || new Date().toISOString();
      if (classId) {
        const { error } = await supabase.from("classes").update({ class_name: name.trim(), year_level: year.trim(), subject: subject.trim() }).eq("id", classId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("classes").insert({ teacher_id: auth.user.id, class_name: name.trim(), year_level: year.trim(), subject: subject.trim() }).select("id, created_at").single();
        if (error) throw error;
        classId = data.id; createdAt = data.created_at;
      }
      if (removed.length) {
        const { error } = await supabase.from("students").delete().in("id", removed);
        if (error) throw error;
      }
      const names = newStudents.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
      let inserted: ClassRecord["students"] = [];
      if (names.length) {
        const { data, error } = await supabase.from("students").insert(names.map((displayName, index) => ({ class_id: classId!, display_name: displayName, student_code: `M${String(students.length + index + 1).padStart(3, "0")}` }))).select("id, display_name, student_code, active");
        if (error) throw error;
        inserted = data || [];
      }
      onSaved({ id: classId!, class_name: name.trim(), year_level: year.trim(), subject: subject.trim(), created_at: createdAt, students: [...students, ...inserted] });
      onClose();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Kelas tidak dapat disimpan."); }
    finally { setBusy(false); }
  }

  async function deleteClass() {
    if (!item || !window.confirm(`Padam ${item.class_name} bersama semua refleksi berkaitan?`)) return;
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().from("classes").delete().eq("id", item.id);
    if (error) { setNotice(error.message); setBusy(false); return; }
    onDeleted(item.id); onClose();
  }

  return <div className="modal-backdrop"><section className="form-modal" role="dialog" aria-modal="true">
    <header className="workflow-header"><div><span className="eyebrow">{item ? "URUS KELAS" : "KELAS BAHARU"}</span><h2>{item ? item.class_name : "Tambah kelas"}</h2></div><button className="icon-button" onClick={onClose}>×</button></header>
    <div className="workflow-body">
      <div className="two-fields"><label className="form-field"><span>Nama kelas</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="3 Cemerlang" /></label><label className="form-field"><span>Tahun / Tingkatan</span><input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Tahun 3" /></label></div>
      <label className="form-field"><span>Subjek</span><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Matematik" /></label>
      {students.length > 0 && <div className="student-editor"><span className="field-title">Murid aktif ({students.length})</span><div>{students.map((student) => <span key={student.id}>{student.display_name}<button onClick={() => removeStudent(student.id)} aria-label={`Buang ${student.display_name}`}>×</button></span>)}</div></div>}
      <label className="form-field"><span>{item ? "Tambah murid lain" : "Senarai murid"} — satu nama setiap baris</span><textarea rows={6} value={newStudents} onChange={(e) => setNewStudents(e.target.value)} placeholder={"Ahmad\nAli\nSarah\nAina\nKumar"} /></label>
      {notice && <p className="workflow-notice inline">{notice}</p>}
      <div className="modal-actions">{item ? <button className="danger-button" disabled={busy} onClick={deleteClass}>Padam kelas</button> : <span />}<div><button className="secondary-button" onClick={onClose}>Batal</button><button className="primary-button" disabled={busy} onClick={save}>{busy ? "Menyimpan…" : "Simpan kelas"}</button></div></div>
    </div>
  </section></div>;
}

