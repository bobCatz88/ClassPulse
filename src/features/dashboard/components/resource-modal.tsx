"use client";

import { useState } from "react";
import type { RescueRecord } from "@/features/dashboard/types";
import type { ResourceType, TeachingResourceContent } from "@/features/resources/generator";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

const resourceLabels: Record<ResourceType, string> = {
  analogy: "Analogi alternatif",
  group_activity: "Aktiviti kumpulan",
  worksheet: "Lembaran kerja",
  differentiated_questions: "Soalan pembezaan aras",
  teacher_script: "Skrip penerangan guru",
  slide_outline: "Rangka slaid ringkas",
};

function contentText(content: TeachingResourceContent) {
  return [content.title, ...content.sections.map((section) => `${section.heading}\n${section.body}`)].join("\n\n");
}

export function ResourceModal({ plan, classId, onClose }: { plan: RescueRecord; classId: string; onClose: () => void }) {
  const [resourceType, setResourceType] = useState<ResourceType>("worksheet");
  const [content, setContent] = useState<TeachingResourceContent | null>(null);
  const [sourceNote, setSourceNote] = useState("generated_fallback");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function generate() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/resources/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, lessonRescueId: plan.id, resourceType }) });
      const result = await response.json() as { content?: TeachingResourceContent; sourceNote?: string; error?: string };
      if (!response.ok || !result.content) throw new Error(result.error || "Tidak dapat menjana bahan.");
      setContent(result.content);
      setSourceNote(result.sourceNote || "generated_fallback");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Tidak dapat menjana bahan.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!content) return;
    await navigator.clipboard.writeText(contentText(content));
    setNotice("Bahan disalin.");
  }

  async function save() {
    if (!content) return;
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setNotice("Sila log masuk semula.");
      return;
    }
    const { error } = await supabase.from("teaching_resources").insert({ teacher_id: auth.user.id, class_id: classId, lesson_rescue_id: plan.id, resource_type: resourceType, content, source_note: sourceNote, confirmed: true });
    if (error) {
      setNotice("Bahan tidak dapat disimpan.");
      return;
    }
    onClose();
  }

  return <div className="modal-backdrop"><section className="workflow-modal" role="dialog" aria-modal="true"><header className="workflow-header"><div><span className="eyebrow">BAHAN PENGAJARAN</span><h2>Jana bahan daripada Lesson Rescue</h2></div><button className="icon-button" onClick={onClose}>x</button></header><div className="workflow-body"><label className="form-field"><span>Jenis bahan</span><select value={resourceType} onChange={(event) => setResourceType(event.target.value as ResourceType)}>{(Object.keys(resourceLabels) as ResourceType[]).map((key) => <option value={key} key={key}>{resourceLabels[key]}</option>)}</select></label>{content ? <div className="question-list"><label className="form-field"><span>Tajuk</span><input value={content.title} onChange={(event) => setContent({ ...content, title: event.target.value })} /></label>{content.sections.map((section, index) => <div className="two-fields" key={`${section.heading}-${index}`}><label className="form-field"><span>Bahagian</span><input value={section.heading} onChange={(event) => setContent({ ...content, sections: content.sections.map((item, itemIndex) => itemIndex === index ? { ...item, heading: event.target.value } : item) })} /></label><label className="form-field"><span>Kandungan</span><textarea rows={3} value={section.body} onChange={(event) => setContent({ ...content, sections: content.sections.map((item, itemIndex) => itemIndex === index ? { ...item, body: event.target.value } : item) })} /></label></div>)}</div> : <p className="muted-copy">Pilih jenis bahan, jana draf, kemudian edit sebelum simpan sebagai rekod.</p>}<div className="modal-actions"><button className="secondary-button" disabled={busy} onClick={() => void generate()}>{busy ? "Menjana..." : content ? "Jana semula" : "Jana bahan"}</button>{content ? <><button className="secondary-button" onClick={() => void copy()}>Salin</button><button className="primary-button" onClick={() => void save()}>Simpan bahan</button></> : null}</div>{notice && <p className="workflow-notice inline">{notice}</p>}</div></section></div>;
}
