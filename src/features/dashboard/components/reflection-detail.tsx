"use client";

import { useState } from "react";
import type { OutcomeRecord, ReflectionRecord, RescueRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

const outcomeLabels = {
  successful: "Berjaya",
  partly_successful: "Sebahagian berjaya",
  unsuccessful: "Tidak berjaya",
  not_implemented: "Belum dilaksanakan",
} as const;

export function ReflectionDetail({ item, className, onClose, onFollowUp }: { item: ReflectionRecord; className: string; onClose: () => void; onFollowUp: (plan: RescueRecord) => void }) {
  const plan = item.lesson_rescues[0];
  async function copyPlan() {
    if (!plan) return;
    const text = [plan.title, plan.objective, ...plan.steps.map((step, index) => `${index + 1}. ${step.title} (${step.durationMinutes} minit): ${step.instruction}`), `Penerangan alternatif: ${plan.alternative_explanation || "-"}`, ...plan.exit_questions.map((q) => `Soalan keluar: ${q}`)].join("\n");
    await navigator.clipboard.writeText(text);
  }
  return <div className="modal-backdrop"><section className="workflow-modal detail-modal" role="dialog" aria-modal="true">
    <header className="workflow-header"><div><span className="eyebrow">{className} · {new Date(item.recorded_at).toLocaleDateString("ms-MY")}</span><h2>{item.topic || item.subject || "Refleksi pengajaran"}</h2></div><button className="icon-button" onClick={onClose}>×</button></header>
    <div className="workflow-body"><section className="detail-section"><span className="eyebrow">TRANSKRIP</span><p>{item.transcript}</p></section><section className="detail-section accent"><span className="eyebrow">RINGKASAN</span><p>{item.class_summary}</p></section>
      <div className="result-grid"><section className="result-card"><span className="eyebrow">ISU DIKENAL PASTI</span>{item.analysis.learningIssues?.map((issue) => <div className="issue-line" key={issue.title}><b>{issue.title}</b><p>{issue.description}</p><small>Keyakinan: {issue.confidence}</small></div>)}</section>
      <section className="result-card accent"><span className="eyebrow">LESSON RESCUE</span>{plan ? <><h3>{plan.title}</h3><p>{plan.objective}</p><ol>{plan.steps.map((step) => <li key={step.title}><b>{step.title}</b> — {step.instruction}</li>)}</ol><div className="modal-actions compact"><button className="secondary-button" onClick={copyPlan}>Salin pelan</button><button className="primary-button" onClick={() => onFollowUp(plan)}>Rekod hasil</button></div></> : <p>Tiada pelan disimpan.</p>}</section></div>
      {plan?.intervention_outcomes.length ? <section className="detail-section"><span className="eyebrow">SEJARAH SUSULAN</span>{plan.intervention_outcomes.map((outcome) => <div className="outcome-line" key={outcome.id}><b>{outcomeLabels[outcome.outcome]}</b><span>{new Date(outcome.intervention_date).toLocaleDateString("ms-MY")}</span><p>{outcome.notes || "Tiada nota."}</p></div>)}</section> : null}
    </div>
  </section></div>;
}

export function FollowUpModal({ plan, onClose, onSaved }: { plan: RescueRecord; onClose: () => void; onSaved: (outcome: OutcomeRecord) => void }) {
  const [outcome, setOutcome] = useState<OutcomeRecord["outcome"]>("successful");
  const [notes, setNotes] = useState("");
  const [remaining, setRemaining] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function save() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sesi tamat.");
      const { data, error } = await supabase.from("intervention_outcomes").insert({
        lesson_rescue_id: plan.id, teacher_id: auth.user.id, outcome, notes: notes.trim() || null,
        remaining_student_count: remaining === "" ? null : Number(remaining), intervention_date: new Date().toISOString().slice(0, 10),
      }).select("id, outcome, notes, remaining_student_count, intervention_date").single();
      if (error) throw error;
      onSaved(data as OutcomeRecord); onClose();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Hasil tidak dapat disimpan."); }
    finally { setBusy(false); }
  }

  return <div className="modal-backdrop"><section className="form-modal" role="dialog" aria-modal="true"><header className="workflow-header"><div><span className="eyebrow">SUSULAN INTERVENSI</span><h2>Adakah pelan ini berkesan?</h2></div><button className="icon-button" onClick={onClose}>×</button></header><div className="workflow-body">
    <div className="outcome-choices">{(Object.keys(outcomeLabels) as OutcomeRecord["outcome"][]).map((key) => <button className={outcome === key ? "active" : ""} key={key} onClick={() => setOutcome(key)}>{outcomeLabels[key]}</button>)}</div>
    <label className="form-field"><span>Bilangan murid masih belum menguasai</span><input type="number" min="0" value={remaining} onChange={(e) => setRemaining(e.target.value)} /></label>
    <label className="form-field"><span>Nota ringkas</span><textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Apa yang berkesan atau perlu diubah?" /></label>
    {notice && <p className="workflow-notice inline">{notice}</p>}<div className="modal-actions"><button className="secondary-button" onClick={onClose}>Batal</button><button className="primary-button" disabled={busy} onClick={save}>{busy ? "Menyimpan…" : "Simpan hasil"}</button></div>
  </div></section></div>;
}

