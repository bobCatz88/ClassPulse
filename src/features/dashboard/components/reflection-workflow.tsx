"use client";

import { useEffect, useRef, useState } from "react";
import type { ReflectionAnalysis } from "@/features/reflections/types";
import type { ClassRecord, ReflectionRecord } from "@/features/dashboard/types";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

type Props = { classes: ClassRecord[]; initialClassId?: string; onClose: () => void; onSaved: (item: ReflectionRecord) => void };
type SpeechLike = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null; onerror: (() => void) | null; start(): void; stop(): void };
type SpeechCtor = new () => SpeechLike;
const sample = "Hari ini saya ajar pecahan. Lebih kurang lapan murid masih keliru antara pengangka dan penyebut. Ahmad dan Ali kurang fokus. Sarah boleh jawab soalan mudah tetapi keliru apabila soalan menggunakan gambar.";

export function ReflectionWorkflow({ classes, initialClassId, onClose, onSaved }: Props) {
  const [stage, setStage] = useState<"record" | "review" | "diagnose" | "rescue">("record");
  const [classId, setClassId] = useState(initialClassId || classes[0]?.id || "");
  const [topic, setTopic] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<ReflectionAnalysis | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const speech = useRef<SpeechLike | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedClass = classes.find((item) => item.id === classId);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    speech.current?.stop();
  }, []);

  async function startRecording() {
    if (!classId) return setNotice("Tambah atau pilih kelas dahulu.");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Rakaman tidak disokong. Gunakan input teks.");
      return setStage("review");
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      chunks.current = [];
      const mediaRecorder = new MediaRecorder(media);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      mediaRecorder.onstop = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: mediaRecorder.mimeType || "audio/webm" })));
      };
      mediaRecorder.start();
      const voiceWindow = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
      const Voice = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
      if (Voice) {
        const recognition = new Voice();
        recognition.lang = "ms-MY";
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalText = transcript;
        recognition.onresult = (event) => {
          let interim = "";
          for (let i = 0; i < event.results.length; i += 1) {
            const result = event.results[i];
            if (result.isFinal) finalText = `${finalText} ${result[0].transcript}`.trim();
            else interim = result[0].transcript;
          }
          setTranscript(`${finalText} ${interim}`.trim());
        };
        recognition.onerror = () => setNotice("Audio masih dirakam, tetapi transkripsi langsung tidak tersedia.");
        recognition.start();
        speech.current = recognition;
      } else setNotice("Audio sedang dirakam. Taip transkrip selepas berhenti.");
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch { setNotice("Akses mikrofon tidak dibenarkan. Benarkan mikrofon atau taip refleksi."); }
  }

  function stopRecording() {
    if (timer.current) clearInterval(timer.current);
    recorder.current?.stop();
    speech.current?.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    setRecording(false);
    setStage("review");
  }

  async function analyze() {
    if (!classId || transcript.trim().length < 3) return setNotice("Pilih kelas dan masukkan refleksi dahulu.");
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/reflections/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, transcript }) });
      const result = await response.json() as ReflectionAnalysis & { error?: string };
      if (!response.ok) throw new Error(result.error || "Analisis gagal.");
      setAnalysis(result);
      setStage(result.diagnosticQuestions.length ? "diagnose" : "rescue");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Analisis gagal."); }
    finally { setBusy(false); }
  }

  function patchAnalysis(value: Partial<ReflectionAnalysis>) {
    setAnalysis((current) => current ? { ...current, ...value } : current);
  }

  async function save() {
    if (!analysis || !selectedClass) return;
    setBusy(true); setNotice("");
    const supabase = createSupabaseBrowserClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sesi tamat. Log masuk semula.");
      const { data: saved, error } = await supabase.from("reflections").insert({
        class_id: classId, teacher_id: auth.user.id, transcript: transcript.trim(), subject: selectedClass.subject,
        topic: topic.trim() || null, class_summary: analysis.summary, analysis, status: "confirmed",
      }).select("id, recorded_at").single();
      if (error) throw error;
      const answerRows = analysis.diagnosticQuestions.map((question) => ({
        reflection_id: saved.id, teacher_id: auth.user!.id, question_id: question.id, question: question.question,
        options: question.options, answer: answers[question.id] || "Tidak pasti",
      }));
      if (answerRows.length) {
        const { error: answerError } = await supabase.from("diagnostic_answers").insert(answerRows);
        if (answerError) throw answerError;
      }
      const plan = analysis.lessonRescue;
      const { data: savedPlan, error: planError } = await supabase.from("lesson_rescues").insert({
        reflection_id: saved.id, teacher_id: auth.user.id, title: `Lesson Rescue: ${topic.trim() || selectedClass.subject}`,
        duration_minutes: plan.durationMinutes, target_students: "Berdasarkan refleksi guru", objective: plan.objective,
        materials: plan.materials, steps: plan.steps, alternative_explanation: plan.alternativeExplanation,
        exit_questions: plan.exitQuestions, confirmed: true,
      }).select("id, title").single();
      if (planError) throw planError;
      onSaved({
        id: saved.id, class_id: classId, transcript: transcript.trim(), subject: selectedClass.subject, topic: topic.trim() || null,
        class_summary: analysis.summary, analysis, status: "confirmed", recorded_at: saved.recorded_at,
        diagnostic_answers: answerRows.map((row, i) => ({ id: `answer-${i}`, question_id: row.question_id, question: row.question, answer: row.answer })),
        lesson_rescues: [{ id: savedPlan.id, title: savedPlan.title, duration_minutes: plan.durationMinutes, objective: plan.objective,
          materials: plan.materials, steps: plan.steps, alternative_explanation: plan.alternativeExplanation,
          exit_questions: plan.exitQuestions, confirmed: true, intervention_outcomes: [] }],
      });
      onClose();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Refleksi tidak dapat disimpan."); }
    finally { setBusy(false); }
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="modal-backdrop"><section className="workflow-modal" role="dialog" aria-modal="true">
    <header className="workflow-header"><div><span className="eyebrow">REFLEKSI BAHARU</span><h2>Tukar pemerhatian kepada tindakan</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup">×</button></header>
    <div className="workflow-steps">{["Rakam", "Semak", "Diagnosis", "Lesson Rescue"].map((label, index) => <span key={label} className={["record", "review", "diagnose", "rescue"].indexOf(stage) >= index ? "active" : ""}>{index + 1} {label}</span>)}</div>
    {stage === "record" && <div className="workflow-body centered-stage">
      <label className="form-field"><span>Kelas</span><select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Pilih kelas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_name} · {item.subject}</option>)}</select></label>
      <button className={`record-button ${recording ? "recording" : ""}`} onClick={recording ? stopRecording : startRecording}>{recording ? "■" : "●"}</button><b className="record-clock">{clock}</b>
      <p>{recording ? "Sedang merakam dan menukar suara kepada teks…" : "Tekan untuk mula merakam 30–60 saat"}</p>
      <button className="secondary-button" onClick={() => setStage("review")}>Taip refleksi</button>
      <button className="text-button" onClick={() => { setTranscript(sample); setTopic("Pecahan"); setStage("review"); }}>Gunakan contoh refleksi</button>
    </div>}
    {stage === "review" && <div className="workflow-body">
      <div className="two-fields"><label className="form-field"><span>Kelas</span><select value={classId} onChange={(e) => setClassId(e.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_name} · {item.subject}</option>)}</select></label><label className="form-field"><span>Topik</span><input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: Pecahan" /></label></div>
      {audioUrl && <audio className="audio-preview" src={audioUrl} controls />}
      <label className="form-field"><span>Transkrip — semak dan betulkan</span><textarea rows={9} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Apa yang diajar, difahami dan masih mengelirukan?" /></label>
      <div className="modal-actions"><button className="secondary-button" onClick={() => setStage("record")}>Kembali</button><button className="primary-button" disabled={busy} onClick={analyze}>{busy ? "Menganalisis…" : "Analisis refleksi →"}</button></div>
    </div>}
    {stage === "diagnose" && analysis && <div className="workflow-body"><span className="eyebrow">SOALAN DIAGNOSIS</span><h3>Sahkan andaian sebelum bina pelan</h3>
      <div className="question-list">{analysis.diagnosticQuestions.map((question, index) => <fieldset key={question.id}><legend>{index + 1}. {question.question}</legend><div>{question.options.map((option) => <button className={answers[question.id] === option ? "choice active" : "choice"} key={option} onClick={() => setAnswers((old) => ({ ...old, [question.id]: option }))}>{option}</button>)}</div></fieldset>)}</div>
      <div className="modal-actions"><button className="secondary-button" onClick={() => setStage("review")}>Semak transkrip</button><button className="primary-button" onClick={() => setStage("rescue")}>Lihat Lesson Rescue →</button></div>
    </div>}
    {stage === "rescue" && analysis && <div className="workflow-body"><span className="eyebrow">SEMAKAN GURU</span><h3>Edit dan sahkan cadangan</h3>
      <label className="form-field"><span>Ringkasan kelas</span><textarea rows={3} value={analysis.summary} onChange={(e) => patchAnalysis({ summary: e.target.value })} /></label>
      <div className="result-grid"><section className="result-card"><span className="eyebrow">ISU PEMBELAJARAN</span>{analysis.learningIssues.map((issue, index) => <div className="editable-issue" key={index}><input value={issue.title} onChange={(e) => patchAnalysis({ learningIssues: analysis.learningIssues.map((item, i) => i === index ? { ...item, title: e.target.value } : item) })} /><textarea rows={2} value={issue.description} onChange={(e) => patchAnalysis({ learningIssues: analysis.learningIssues.map((item, i) => i === index ? { ...item, description: e.target.value } : item) })} /></div>)}</section>
      <section className="result-card accent"><span className="eyebrow">LESSON RESCUE · {analysis.lessonRescue.durationMinutes} MINIT</span><label className="form-field"><span>Objektif</span><textarea rows={2} value={analysis.lessonRescue.objective} onChange={(e) => patchAnalysis({ lessonRescue: { ...analysis.lessonRescue, objective: e.target.value } })} /></label><ol>{analysis.lessonRescue.steps.map((step) => <li key={step.title}><b>{step.title}</b> ({step.durationMinutes} minit) — {step.instruction}</li>)}</ol><label className="form-field"><span>Penerangan alternatif</span><textarea rows={3} value={analysis.lessonRescue.alternativeExplanation} onChange={(e) => patchAnalysis({ lessonRescue: { ...analysis.lessonRescue, alternativeExplanation: e.target.value } })} /></label></section></div>
      <div className="modal-actions"><button className="secondary-button" onClick={() => setStage("diagnose")}>Kembali</button><button className="primary-button" disabled={busy} onClick={save}>{busy ? "Menyimpan…" : "Simpan refleksi & pelan ✓"}</button></div>
    </div>}
    {notice && <p className="workflow-notice">{notice}</p>}
  </section></div>;
}

