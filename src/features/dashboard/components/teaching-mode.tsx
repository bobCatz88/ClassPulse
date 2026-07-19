"use client";

import { useEffect, useMemo, useState } from "react";

import type { RescueRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

type Props = { plan: RescueRecord; classId: string; onClose: () => void; onCompleted: () => void };

export function TeachingMode({ plan, classId, onClose, onCompleted }: Props) {
  const [runId, setRunId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedTotal, setPausedTotal] = useState(0);
  const [now, setNow] = useState(0);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const elapsed = startedAt ? Math.max(0, Math.floor(((pausedAt ?? now) - startedAt - pausedTotal) / 1000)) : 0;
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const current = plan.steps[step];
  const progress = useMemo(() => `${Math.min(step + 1, plan.steps.length)}/${plan.steps.length}`, [plan.steps.length, step]);

  async function start() {
    setBusy(true); setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(false); setNotice("Sila log masuk semula."); return; }
    const { data, error } = await supabase.from("lesson_rescue_runs").insert({ teacher_id: auth.user.id, lesson_rescue_id: plan.id, class_id: classId, current_step: 0, completed_steps: [] }).select("id, started_at").single();
    setBusy(false);
    if (error || !data) { setNotice(error?.message || "Mod mengajar tidak dapat dimulakan."); return; }
    setRunId(data.id); setStartedAt(new Date(data.started_at).getTime());
  }

  function togglePause() {
    if (!pausedAt) { setPausedAt(Date.now()); return; }
    setPausedTotal((value) => value + Date.now() - pausedAt); setPausedAt(null);
  }

  function next() {
    setDone((value) => value.includes(step) ? value : [...value, step]);
    setStep((value) => Math.min(value + 1, plan.steps.length - 1));
  }

  async function complete() {
    if (!runId) return;
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().from("lesson_rescue_runs").update({ status: "completed", completed_at: new Date().toISOString(), current_step: plan.steps.length, completed_steps: [...new Set([...done, step])] }).eq("id", runId);
    setBusy(false);
    if (error) { setNotice("Pelaksanaan tidak dapat disimpan."); return; }
    onCompleted();
  }

  return <div className="modal-backdrop"><section className="workflow-modal teaching-mode" role="dialog" aria-modal="true"><header className="workflow-header"><div><span className="eyebrow">MOD MENGAJAR · {progress}</span><h2>{plan.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup">×</button></header><div className="workflow-body">
    {!runId ? <><p>Gunakan pelan ini dengan satu langkah pada satu masa.</p><div className="detail-section"><span className="eyebrow">BAHAN</span>{plan.materials.length ? <ul>{plan.materials.map((material) => <li key={material}><label><input type="checkbox" checked={materials.includes(material)} onChange={() => setMaterials((value) => value.includes(material) ? value.filter((item) => item !== material) : [...value, material])} /> {material}</label></li>)}</ul> : <p>Tiada bahan khusus diperlukan.</p>}</div><button className="primary-button" disabled={busy} onClick={() => void start()}>{busy ? "Menyediakan…" : "Mula mengajar"}</button></> : <><div className="teaching-clock"><b>{clock}</b><span>sasaran {plan.duration_minutes} minit</span><button className="secondary-button" onClick={togglePause}>{pausedAt ? "Sambung" : "Jeda"}</button></div><section className="detail-section accent"><span className="eyebrow">LANGKAH {step + 1}</span><h3>{current?.title}</h3><p>{current?.instruction}</p><small>{current?.durationMinutes} minit</small></section><div className="modal-actions"><button className="secondary-button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>← Kembali</button>{step < plan.steps.length - 1 ? <button className="primary-button" onClick={next}>Selesai langkah & seterusnya →</button> : <button className="primary-button" disabled={busy} onClick={() => void complete()}>{busy ? "Menyimpan…" : "Tamatkan pelan"}</button>}</div></>}
    {notice && <p className="workflow-notice">{notice}</p>}
  </div></section></div>;
}
