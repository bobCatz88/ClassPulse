"use client";

import { useEffect, useMemo, useState } from "react";
import { repeatedLearningIssues, type EvidenceInsight } from "@/features/analytics/insights";
import type { ReflectionRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

type StoredInsight = {
  class_id: string;
  title: string;
  status: "proposed" | "accepted" | "dismissed";
  evidence_refs: string[] | null;
};

type InsightWithClass = EvidenceInsight & { classId: string; classLabel: string };

function evidenceKey(item: Pick<InsightWithClass, "classId" | "title">) {
  return `${item.classId}:${item.title}`;
}

export function TeachingInsightsPanel({ reflections }: { reflections: ReflectionRecord[] }) {
  const [stored, setStored] = useState<StoredInsight[]>([]);
  const [notice, setNotice] = useState("");
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    let active = true;
    void createSupabaseBrowserClient()
      .from("teaching_insights")
      .select("class_id,title,status,evidence_refs")
      .then(({ data }) => {
        if (active) setStored((data || []) as StoredInsight[]);
      });
    return () => {
      active = false;
    };
  }, []);

  const storedByKey = useMemo(() => new Map(stored.map((item) => [evidenceKey({ classId: item.class_id, title: item.title }), item])), [stored]);
  const insights = useMemo(() => {
    const classNames = new Map(reflections.map((item) => [item.class_id, item.subject || "Kelas"]));
    return repeatedLearningIssues(reflections)
      .map((insight) => {
        const reflection = reflections.find((item) => insight.reflectionIds.includes(item.id));
        if (!reflection) return null;
        return { ...insight, classId: reflection.class_id, classLabel: classNames.get(reflection.class_id) || "Kelas" };
      })
      .filter((item): item is InsightWithClass => Boolean(item))
      .filter((item) => {
        const existing = storedByKey.get(evidenceKey(item));
        if (!existing || existing.status !== "dismissed") return true;
        return (existing.evidence_refs?.length || 0) < item.count;
      });
  }, [reflections, storedByKey]);

  async function setStatus(insight: InsightWithClass, status: "accepted" | "dismissed") {
    const key = evidenceKey(insight);
    setBusyKey(key);
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setNotice("Sila log masuk semula.");
      setBusyKey("");
      return;
    }
    const payload = {
      teacher_id: auth.user.id,
      class_id: insight.classId,
      insight_type: "repeated_learning_issue",
      title: insight.title,
      description: `${insight.count} refleksi menunjukkan corak ini berulang.`,
      evidence_refs: insight.reflectionIds,
      confidence: insight.count >= 5 ? "high" : "medium",
      status,
    };
    const { error } = await supabase
      .from("teaching_insights")
      .upsert(payload, { onConflict: "teacher_id,class_id,insight_type,title" });
    setBusyKey("");
    if (error) {
      setNotice("Insight tidak dapat dikemas kini.");
      return;
    }
    setStored((items) => {
      const next = { class_id: insight.classId, title: insight.title, status, evidence_refs: insight.reflectionIds };
      return items.some((item) => evidenceKey({ classId: item.class_id, title: item.title }) === key)
        ? items.map((item) => (evidenceKey({ classId: item.class_id, title: item.title }) === key ? next : item))
        : [...items, next];
    });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CORAK BERASASKAN BUKTI</span>
          <h3>Class Memory</h3>
        </div>
      </div>
      {insights.length ? (
        <div className="class-list">
          {insights.map((insight) => {
            const key = evidenceKey(insight);
            const accepted = storedByKey.get(key)?.status === "accepted";
            return (
              <div className="class-row simple-row" key={key}>
                <span className="class-accent class-accent--purple" />
                <div className="class-main">
                  <div>
                    <b>{insight.title}</b>
                    <span>{insight.count} bukti refleksi · {insight.classLabel}</span>
                  </div>
                </div>
                {accepted ? <span className="row-action">Diterima</span> : (
                  <div className="card-actions">
                    <button className="secondary-button" disabled={busyKey === key} onClick={() => void setStatus(insight, "accepted")}>Terima</button>
                    <button className="row-action" disabled={busyKey === key} onClick={() => void setStatus(insight, "dismissed")}>Tolak</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted-copy">Corak akan dipaparkan selepas sekurang-kurangnya tiga rekod bukti.</p>
      )}
      {notice && <p className="muted-copy">{notice}</p>}
    </section>
  );
}
