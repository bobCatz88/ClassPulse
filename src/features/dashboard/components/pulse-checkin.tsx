"use client";

import { useState } from "react";

import type { ClassPulse, ClassRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

type PulseValue = "strong" | "mixed" | "needs_support";
type EngagementValue = "high" | "mixed" | "low";
type EnergyValue = "high" | "normal" | "low";

type Props = {
  classes: ClassRecord[];
  onClose: () => void;
  onSaved: (pulse: ClassPulse) => void;
};

export function PulseCheckIn({ classes, onClose, onSaved }: Props) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [understanding, setUnderstanding] = useState<PulseValue>("mixed");
  const [engagement, setEngagement] = useState<EngagementValue>("mixed");
  const [energy, setEnergy] = useState<EnergyValue>("normal");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function save() {
    if (!classId) return setNotice("Pilih kelas dahulu.");
    setBusy(true);
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBusy(false);
      return setNotice("Sila log masuk semula.");
    }
    const { data, error } = await supabase.from("class_pulses").insert({
      class_id: classId,
      teacher_id: auth.user.id,
      understanding,
      engagement,
      energy_level: energy,
      note: note.trim() || null,
    }).select("id, class_id, understanding, engagement, energy_level, note, observed_at").single();
    setBusy(false);
    if (error || !data) return setNotice(error?.message || "Pulse tidak dapat disimpan.");
    onSaved(data as ClassPulse);
    onClose();
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="workflow-modal pulse-checkin" role="dialog" aria-modal="true" aria-labelledby="pulse-title">
      <header className="workflow-header"><div><span className="eyebrow">PULSE KELAS</span><h2 id="pulse-title">Bagaimana keadaan kelas tadi?</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup">×</button></header>
      <div className="workflow-body">
        <label className="form-field"><span>Kelas</span><select value={classId} onChange={(event) => setClassId(event.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_name} · {item.subject}</option>)}</select></label>
        <PulseGroup label="Kefahaman" value={understanding} onChange={setUnderstanding} options={[['strong', 'Hijau — lancar'], ['mixed', 'Kuning — bercampur'], ['needs_support', 'Merah — perlu bantuan']]} />
        <PulseGroup label="Penglibatan" value={engagement} onChange={setEngagement} options={[['high', 'Tinggi'], ['mixed', 'Bercampur'], ['low', 'Rendah']]} />
        <PulseGroup label="Tenaga kelas" value={energy} onChange={setEnergy} options={[['high', 'Tinggi'], ['normal', 'Biasa'], ['low', 'Rendah']]} />
        <label className="form-field"><span>Nota ringkas (pilihan)</span><textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Aktiviti berkumpulan membantu murid mula menjawab." /></label>
        <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Batal</button><button className="primary-button" disabled={busy} onClick={() => void save()}>{busy ? "Menyimpan…" : "Simpan Pulse"}</button></div>
        {notice && <p className="workflow-notice">{notice}</p>}
      </div>
    </section>
  </div>;
}

function PulseGroup<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: Array<[T, string]> }) {
  return <fieldset className="pulse-group"><legend>{label}</legend><div>{options.map(([option, text]) => <button key={option} type="button" className={value === option ? "choice active" : "choice"} onClick={() => onChange(option)}>{text}</button>)}</div></fieldset>;
}
