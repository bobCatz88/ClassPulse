"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { ReflectionAnalysis } from "@/features/reflections/types";

type IconName =
  | "grid"
  | "book"
  | "history"
  | "brain"
  | "settings"
  | "plus"
  | "arrow"
  | "mic"
  | "spark"
  | "calendar"
  | "clock"
  | "check"
  | "dots"
  | "bell"
  | "search"
  | "chevron"
  | "play"
  | "stop"
  | "wave"
  | "lock"
  | "x"
  | "back";

type ClassItem = {
  id: string;
  name: string;
  subject: string;
  group: string;
  time: string;
  status: "Selesai" | "Hari ini" | "Akan datang";
  accent: "purple" | "blue" | "peach" | "green";
};

const classes: ClassItem[] = [
  {
    id: "5-amanah",
    name: "5 Amanah",
    subject: "Matematik",
    group: "24 murid",
    time: "8:00 – 9:00 pagi",
    status: "Selesai",
    accent: "purple",
  },
  {
    id: "4-bestari",
    name: "4 Bestari",
    subject: "Sains",
    group: "28 murid",
    time: "10:30 – 11:30 pagi",
    status: "Hari ini",
    accent: "blue",
  },
  {
    id: "6-cerdas",
    name: "6 Cerdas",
    subject: "Matematik",
    group: "26 murid",
    time: "2:00 – 3:00 petang",
    status: "Akan datang",
    accent: "peach",
  },
];

const navItems: Array<{ label: string; icon: IconName }> = [
  { label: "Ringkasan", icon: "grid" },
  { label: "Kelas saya", icon: "book" },
  { label: "Sejarah refleksi", icon: "history" },
  { label: "Memori pengajaran", icon: "brain" },
];

const demoTranscript =
  "Dalam kelas 4 Bestari tadi, saya terangkan kitar air menggunakan gambar rajah. " +
  "Ramai murid boleh sebut penyejatan, tetapi mereka masih keliru beza pemeluwapan dan kerpasan. " +
  "Bila saya minta mereka lukis semula, hanya 10 daripada 28 murid dapat susun urutan dengan betul. " +
  "Saya rasa mereka perlukan contoh yang lebih dekat dengan pengalaman harian.";

const demoAnalysis: ReflectionAnalysis = {
  id: "demo-analysis",
  classId: "4-bestari",
  summary:
    "Murid sudah mengenal istilah asas kitar air, tetapi urutan proses dan beza pemeluwapan–kerpasan masih belum kukuh.",
  observations: [
    {
      text: "Gambar rajah membantu istilah asas, namun belum menghubungkan proses dengan situasi harian.",
      evidence: "Ramai murid boleh sebut penyejatan, tetapi masih keliru beza pemeluwapan dan kerpasan.",
      confidence: "high",
    },
    {
      text: "Sebahagian murid mungkin menghafal istilah tanpa memahami urutan perubahan air.",
      evidence: "Hanya 10 daripada 28 murid dapat menyusun urutan dengan betul.",
      confidence: "medium",
    },
  ],
  learningIssues: [
    {
      title: "Urutan proses belum stabil",
      description: "Murid memerlukan penanda visual dan peluang menyusun semula proses.",
      evidence: "Hanya 10 daripada 28 murid dapat menyusun urutan dengan betul.",
      confidence: "high",
    },
    {
      title: "Istilah hampir serupa",
      description: "Pemeluwapan dan kerpasan perlu dipisahkan melalui contoh yang dapat dilihat.",
      evidence: "Murid masih keliru beza pemeluwapan dan kerpasan.",
      confidence: "medium",
    },
  ],
  diagnosticQuestions: [
    {
      id: "q1",
      question: "Apakah yang berubah apabila wap air terkena permukaan sejuk?",
      options: ["Menjadi titisan air", "Terus hilang", "Bertukar menjadi ais", "Tidak pasti"],
      allowUnsure: true,
    },
    {
      id: "q2",
      question: "Antara hujan dan awan, yang manakah contoh kerpasan?",
      options: ["Hujan", "Awan", "Kedua-duanya", "Tidak pasti"],
      allowUnsure: true,
    },
  ],
  lessonRescue: {
    durationMinutes: 10,
    objective: "Murid boleh menyusun empat proses kitar air dan menerangkan satu perubahan keadaan air.",
    materials: ["Segelas air berais", "Empat kad proses bagi setiap kumpulan"],
    steps: [
      {
        title: "Perhati",
        instruction: "Tunjukkan segelas air berais dan minta murid perhatikan titisan di luar gelas.",
        durationMinutes: 2,
      },
      {
        title: "Susun",
        instruction: "Dalam kumpulan kecil, murid susun empat kad: penyejatan, pemeluwapan, kerpasan, pengumpulan.",
        durationMinutes: 5,
      },
      {
        title: "Terangkan",
        instruction: "Minta setiap kumpulan terangkan satu anak panah menggunakan ayat ‘air berubah kerana…’.",
        durationMinutes: 3,
      },
    ],
    alternativeExplanation:
      "Gunakan analogi perjalanan air: air ‘naik’ sebagai wap, berkumpul menjadi awan, kemudian ‘turun’ sebagai hujan dan berkumpul semula.",
    exitQuestions: [
      "Lukis satu anak panah daripada wap air kepada awan dan namakan prosesnya.",
      "Apakah contoh kerpasan yang pernah kamu lihat minggu ini?",
    ],
  },
  mode: "demo",
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 5.8A2.8 2.8 0 0 1 6.8 3H20v16H6.8A2.8 2.8 0 0 0 4 21.8V5.8Z" /><path d="M4 6h16" /><path d="M8 10h8M8 14h5" /></svg>;
    case "history":
      return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>;
    case "brain":
      return <svg {...common}><path d="M9.5 4.2A3.2 3.2 0 0 0 6 7.3a3.4 3.4 0 0 0-1.3 6.1A3.4 3.4 0 0 0 7 19.7c.9.2 1.8-.1 2.5-.7" /><path d="M14.5 4.2A3.2 3.2 0 0 1 18 7.3a3.4 3.4 0 0 1 1.3 6.1A3.4 3.4 0 0 1 17 19.7c-.9.2-1.8-.1-2.5-.7" /><path d="M12 4v16M8.2 8.5c1.3.2 2.2 1 2.2 2.2M15.8 8.5c-1.3.2-2.2 1-2.2 2.2M8.2 15.2c1.3-.2 2.2-1 2.2-2.2M15.8 15.2c-1.3-.2-2.2-1-2.2-2.2" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2H13v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
    case "mic":
      return <svg {...common}><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7" /></svg>;
    case "spark":
      return <svg {...common}><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 9h18" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4.2 4.2L19 6.5" /></svg>;
    case "dots":
      return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    case "play":
      return <svg {...common}><path d="m9 6 9 6-9 6V6Z" fill="currentColor" stroke="none" /></svg>;
    case "stop":
      return <svg {...common}><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" /></svg>;
    case "wave":
      return <svg {...common}><path d="M3 12h2l1.4-5 2.2 10L11 5l2.3 14L16 8l1.4 4H21" /></svg>;
    case "lock":
      return <svg {...common}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case "x":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "back":
      return <svg {...common}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
    default:
      return null;
  }
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function StatusPill({ status }: { status: ClassItem["status"] }) {
  const className = status === "Selesai" ? "status-pill status-pill--done" : status === "Hari ini" ? "status-pill status-pill--today" : "status-pill status-pill--next";
  return <span className={className}>{status}</span>;
}

function ReflectionModal({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<"record" | "review" | "rescue">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<ReflectionAnalysis | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setIsRecording(false);
    setTranscript(demoTranscript);
    setStage("review");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = async () => {
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Pelayar ini tidak menyokong mikrofon. Contoh refleksi telah dimuatkan untuk anda semak.");
      setTranscript(demoTranscript);
      setStage("review");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.onstop = finishRecording;
      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((value) => value + 1), 1000);
    } catch {
      setNotice("Akses mikrofon belum dibenarkan. Gunakan contoh refleksi di bawah untuk meneruskan demo.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      finishRecording();
    }
  };

  const loadExample = () => {
    setTranscript(demoTranscript);
    setStage("review");
    setNotice("Contoh refleksi dimuatkan. Anda boleh ubah teks sebelum analisis.");
  };

  const analyseReflection = async () => {
    if (!transcript.trim()) {
      setNotice("Tulis atau rakam refleksi dahulu sebelum analisis.");
      return;
    }
    setIsAnalysing(true);
    setNotice("");
    try {
      const response = await fetch("/api/reflections/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: "4-bestari", transcript }),
      });
      if (!response.ok) throw new Error("Analisis tidak tersedia");
      const result = (await response.json()) as ReflectionAnalysis;
      setAnalysis(result);
    } catch {
      setAnalysis({ ...demoAnalysis, mode: "demo" });
      setNotice("Mod demo digunakan kerana servis AI belum disambungkan. Struktur hasil ini sudah sedia untuk integrasi.");
    } finally {
      setIsAnalysing(false);
      setStage("rescue");
    }
  };

  const currentAnalysis = analysis ?? demoAnalysis;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="reflection-modal" role="dialog" aria-modal="true" aria-labelledby="reflection-title">
        <header className="reflection-modal__header">
          <div>
            <p className="eyebrow">REFLEKSI BAHARU · 4 BESTARI</p>
            <h2 id="reflection-title">Apa yang berlaku dalam kelas tadi?</h2>
            <p className="modal-subtitle">Cakap ringkas selama 30–60 saat. ClassPulse bantu susun pemerhatian menjadi tindakan.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Tutup refleksi"><Icon name="x" /></button>
        </header>

        <div className="stepper" aria-label="Kemajuan refleksi">
          <div className={`stepper__item ${stage === "record" ? "is-active" : "is-done"}`}><span>1</span><b>Rakam</b></div>
          <div className="stepper__line" />
          <div className={`stepper__item ${stage === "review" ? "is-active" : stage === "rescue" ? "is-done" : ""}`}><span>2</span><b>Semak</b></div>
          <div className="stepper__line" />
          <div className={`stepper__item ${stage === "rescue" ? "is-active" : ""}`}><span>3</span><b>Lesson Rescue</b></div>
        </div>

        {stage === "record" && (
          <div className="record-stage">
            <div className={`record-orb ${isRecording ? "is-recording" : ""}`}>
              <div className="record-orb__rings" />
              <button className="record-orb__button" onClick={isRecording ? stopRecording : startRecording} aria-label={isRecording ? "Hentikan rakaman" : "Mula rakaman"}>
                <Icon name={isRecording ? "stop" : "mic"} size={28} />
              </button>
            </div>
            <div className="record-timer">{isRecording ? formatTime(elapsed) : "00:00"}</div>
            <h3>{isRecording ? "Sedang merakam…" : "Tekan untuk mula"}</h3>
            <p className="muted-copy">Fokus pada apa yang murid buat, bukan pada penilaian diri.</p>
            <div className="sound-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            {notice && <p className="inline-notice">{notice}</p>}
            <button className="text-button" onClick={loadExample}><Icon name="play" size={14} /> Cuba dengan contoh refleksi</button>
            <div className="privacy-note"><Icon name="lock" size={15} /> Audio hanya digunakan untuk menukar suara kepada teks. Anda kawal apa yang disimpan.</div>
          </div>
        )}

        {stage === "review" && (
          <div className="review-stage">
            <div className="stage-heading"><div><p className="eyebrow">LANGKAH 2</p><h3>Semak transkrip anda</h3></div><span className="chip chip--soft"><Icon name="check" size={14} /> Transkrip siap</span></div>
            <label className="field-label" htmlFor="transcript">Transkrip refleksi</label>
            <textarea id="transcript" className="transcript-box" value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={7} />
            <div className="review-footer"><span className="character-count">{transcript.length} aksara · boleh ubah</span><button className="primary-button" onClick={analyseReflection} disabled={isAnalysing}>{isAnalysing ? "Menganalisis…" : "Susun refleksi"}<Icon name="arrow" size={17} /></button></div>
            {notice && <p className="inline-notice">{notice}</p>}
          </div>
        )}

        {stage === "rescue" && (
          <div className="rescue-stage">
            <div className="stage-heading"><div><p className="eyebrow">HASIL REFLEKSI · MOD {currentAnalysis.mode === "ai" ? "AI" : "DEMO"}</p><h3>Ini langkah seterusnya</h3></div><button className="back-button" onClick={() => setStage("review")}><Icon name="back" size={15} /> Semak semula</button></div>
            <div className="analysis-summary"><div className="analysis-summary__icon"><Icon name="spark" size={20} /></div><div><span className="mini-label">RINGKASAN KELAS</span><p>{currentAnalysis.summary}</p></div></div>
            <div className="analysis-grid">
              <div className="analysis-card"><div className="analysis-card__top"><span className="mini-label">ISU PEMBELAJARAN</span><span className="count-badge">{currentAnalysis.learningIssues.length}</span></div>{currentAnalysis.learningIssues.map((issue) => <div className="issue-row" key={issue.title}><span className={`confidence-dot confidence-dot--${issue.confidence}`} /><div><b>{issue.title}</b><p>{issue.description}</p></div></div>)}</div>
              <div className="analysis-card analysis-card--accent"><div className="analysis-card__top"><span className="mini-label">LESSON RESCUE · {currentAnalysis.lessonRescue.durationMinutes} MIN</span><Icon name="arrow" size={17} /></div><h4>{currentAnalysis.lessonRescue.objective}</h4><ol className="rescue-list">{currentAnalysis.lessonRescue.steps.map((step) => <li key={step.title}><b>{step.title}</b> — {step.instruction}</li>)}</ol><div className="alternative-box"><span>ANALOGI ALTERNATIF</span><p>{currentAnalysis.lessonRescue.alternativeExplanation}</p></div><div className="exit-box"><span>SOALAN KELUAR</span>{currentAnalysis.lessonRescue.exitQuestions.map((question) => <p key={question}><Icon name="check" size={14} />{question}</p>)}</div></div>
            </div>
            <div className="diagnostic-row"><div><span className="mini-label">SOALAN DIAGNOSTIK</span><p>Gunakan satu soalan ini pada awal kelas seterusnya untuk semak andaian.</p></div><div className="diagnostic-question"><span>01</span><b>{currentAnalysis.diagnosticQuestions[0]?.question}</b><Icon name="chevron" size={17} /></div></div>
            <div className="review-footer"><span className="privacy-note"><Icon name="lock" size={15} /> Guru mengesahkan semua cadangan sebelum digunakan.</span><button className="primary-button" onClick={() => setIsSaved(true)} disabled={isSaved}>{isSaved ? "Refleksi disimpan" : "Simpan refleksi"}<Icon name="check" size={17} /></button></div>
            {isSaved && <p className="success-notice">Refleksi disimpan dalam sejarah 4 Bestari. Anda boleh bina memori pengajaran selepas beberapa sesi.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

export function DashboardShell() {
  const [activeNav, setActiveNav] = useState("Ringkasan");
  const [showReflection, setShowReflection] = useState(false);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><span /><span /><span /></div><span>Class<span>Pulse</span></span></div>
        <div className="sidebar-section"><span className="sidebar-label">RUANG KERJA</span><nav>{navItems.map((item) => <button key={item.label} className={`nav-item ${activeNav === item.label ? "is-active" : ""}`} onClick={() => setActiveNav(item.label)}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.label === "Memori pengajaran" && <span className="nav-dot" />}</button>)}</nav></div>
        <div className="sidebar-divider" /><button className={`nav-item ${activeNav === "Tetapan" ? "is-active" : ""}`} onClick={() => setActiveNav("Tetapan")}><Icon name="settings" size={19} /><span>Tetapan</span></button>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-card__icon"><Icon name="spark" size={17} /></div><b>Petua minggu ini</b><p>Refleksi yang spesifik membantu AI beri cadangan yang lebih tajam.</p><button onClick={() => setShowReflection(true)}>Cuba sekarang <Icon name="arrow" size={14} /></button></div><div className="profile"><div className="avatar avatar--sidebar">CA</div><div><b>Cikgu Aina</b><span>Guru Matematik</span></div><SignOutButton /></div></div>
      </aside>

      <section className="content-area">
        <header className="topbar"><div><span className="topbar-kicker">Jumaat, 17 Julai 2026</span><h1>Selamat pagi, Aina <span>✦</span></h1></div><div className="topbar-actions"><button className="search-trigger" aria-label="Cari"><Icon name="search" size={18} /><span>Cari apa-apa…</span><kbd>⌘ K</kbd></button><button className="top-icon" aria-label="Notifikasi"><Icon name="bell" size={19} /><i /></button><div className="avatar">CA</div></div></header>

        <div className="dashboard-scroll">
          <section className="hero-card"><div className="hero-card__copy"><span className="eyebrow eyebrow--light">RINGKASAN MINGGU INI</span><h2>Satu refleksi kecil.<br /><em>Satu kelas yang lebih jelas.</em></h2><p>Anda sudah membuat 3 refleksi minggu ini. Teruskan rentak untuk bina memori pengajaran yang boleh digunakan semula.</p><button className="light-button" onClick={() => setShowReflection(true)}>Mulakan refleksi <Icon name="arrow" size={17} /></button></div><div className="hero-card__visual"><div className="orbit orbit--one" /><div className="orbit orbit--two" /><div className="hero-spark hero-spark--one">✦</div><div className="hero-spark hero-spark--two">✦</div><div className="hero-note"><Icon name="wave" size={19} /><span>Refleksi → tindakan</span></div><div className="hero-orb"><Icon name="mic" size={30} /></div></div></section>

          <section className="metrics-grid"><div className="metric-card"><div className="metric-card__label"><span className="metric-icon metric-icon--purple"><Icon name="book" size={17} /></span><span>Kelas minggu ini</span></div><div className="metric-card__value">8 <small>/ 12</small></div><div className="progress-track"><span style={{ width: "67%" }} /></div><p>4 kelas lagi untuk lengkapkan minggu</p></div><div className="metric-card"><div className="metric-card__label"><span className="metric-icon metric-icon--orange"><Icon name="mic" size={17} /></span><span>Refleksi dibuat</span></div><div className="metric-card__value">3 <small>minggu ini</small></div><div className="mini-bars" aria-label="Trend refleksi tujuh hari"><i style={{ height: "34%" }} /><i style={{ height: "52%" }} /><i style={{ height: "42%" }} /><i style={{ height: "73%" }} /><i style={{ height: "56%" }} /><i style={{ height: "88%" }} /><i className="is-today" style={{ height: "68%" }} /></div><p>+1 berbanding minggu lepas</p></div><div className="metric-card"><div className="metric-card__label"><span className="metric-icon metric-icon--green"><Icon name="check" size={17} /></span><span>Intervensi berkesan</span></div><div className="metric-card__value">84<small>%</small></div><div className="ring-progress"><span>+12%</span></div><p>daripada 19 tindakan yang dicuba</p></div></section>

          <div className="section-grid"><section className="panel schedule-panel"><div className="panel-heading"><div><span className="eyebrow">JADUAL HARI INI</span><h3>Kelas anda</h3></div><button className="ghost-button" onClick={() => setActiveNav("Kelas saya")}>Lihat semua <Icon name="arrow" size={15} /></button></div><div className="class-list">{classes.map((item) => <button className="class-row" key={item.id} onClick={() => item.status === "Selesai" ? setShowReflection(true) : undefined}><span className={`class-accent class-accent--${item.accent}`} /><div className="class-time"><Icon name="clock" size={15} />{item.time}</div><div className="class-main"><div><b>{item.name}</b><span>{item.subject} · {item.group}</span></div><StatusPill status={item.status} /></div>{item.status === "Selesai" ? <span className="row-action">Refleksi <Icon name="arrow" size={15} /></span> : <Icon name="chevron" size={17} />}</button>)}</div><button className="add-class" onClick={() => setActiveNav("Kelas saya")}><span><Icon name="plus" size={17} /></span>Tambah kelas baharu</button></section><section className="panel pulse-panel"><div className="panel-heading"><div><span className="eyebrow">NADI PENGAJARAN</span><h3>Corak yang muncul</h3></div><button className="dots-button" aria-label="Pilihan"><Icon name="dots" size={18} /></button></div><div className="pulse-quote"><div className="quote-mark">“</div><p>Apabila anda beri contoh daripada kehidupan harian, murid lebih cepat berani menerangkan jawapan.</p><span>Dikesan daripada 5 refleksi</span></div><div className="pulse-tags"><span>contoh harian <b>5×</b></span><span>soalan terbuka <b>3×</b></span><span>kerja kumpulan <b>2×</b></span></div><button className="insight-link" onClick={() => setActiveNav("Memori pengajaran")}>Teroka memori pengajaran <Icon name="arrow" size={15} /></button></section></div>

          <section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">TERKINI</span><h3>Refleksi terbaru</h3></div><button className="ghost-button" onClick={() => setActiveNav("Sejarah refleksi")}>Sejarah penuh <Icon name="arrow" size={15} /></button></div><div className="recent-grid"><div className="recent-card"><div className="recent-card__top"><span className="recent-icon recent-icon--blue"><Icon name="wave" size={18} /></span><span>Hari ini · 9:12 pagi</span><Icon name="dots" size={17} /></div><h4>4 Bestari · Kitar air</h4><p>“Ramai murid boleh sebut penyejatan, tetapi masih keliru…”</p><div className="recent-card__bottom"><span className="tag tag--amber">Perlu susulan</span><span>2 isu dikenal pasti</span></div></div><div className="recent-card"><div className="recent-card__top"><span className="recent-icon recent-icon--purple"><Icon name="wave" size={18} /></span><span>Semalam · 3:45 petang</span><Icon name="dots" size={17} /></div><h4>5 Amanah · Pecahan</h4><p>“Bila guna pizza kertas, lebih ramai murid mula nampak…”</p><div className="recent-card__bottom"><span className="tag tag--green">Berjaya</span><span>Lesson Rescue digunakan</span></div></div><button className="recent-card recent-card--new" onClick={() => setShowReflection(true)}><span className="new-card-icon"><Icon name="plus" size={20} /></span><b>Tambah refleksi</b><span>Ambil masa kurang 2 minit</span></button></div></section>
          <footer className="dashboard-footer"><span>ClassPulse MVP · Data demo untuk prototaip</span><span><Icon name="lock" size={13} /> Privasi guru diutamakan</span></footer>
        </div>
      </section>
      {showReflection && <ReflectionModal onClose={() => setShowReflection(false)} />}
    </main>
  );
}
