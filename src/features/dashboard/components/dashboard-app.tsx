"use client";

import { useEffect, useMemo, useState } from "react";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";
import type { ClassRecord, DashboardData, OutcomeRecord, ProfileRecord, ReflectionRecord, RescueRecord } from "@/features/dashboard/types";
import { ClassManager } from "./class-manager";
import { ReflectionWorkflow } from "./reflection-workflow";
import { FollowUpModal, ReflectionDetail } from "./reflection-detail";

type View = "Ringkasan" | "Kelas saya" | "Sejarah refleksi" | "Memori pengajaran" | "Tetapan";
const nav: Array<{ label: View; icon: string }> = [
  { label: "Ringkasan", icon: "▦" }, { label: "Kelas saya", icon: "▤" }, { label: "Sejarah refleksi", icon: "◷" },
  { label: "Memori pengajaran", icon: "✦" },
];
const outcomeLabels: Record<string, string> = { successful: "Berjaya", partly_successful: "Sebahagian berjaya", unsuccessful: "Tidak berjaya", not_implemented: "Belum dilaksanakan" };

export function DashboardApp({ initialData }: { initialData: DashboardData }) {
  const [profile, setProfile] = useState(initialData.profile);
  const [classes, setClasses] = useState(initialData.classes);
  const [reflections, setReflections] = useState(initialData.reflections);
  const [view, setView] = useState<View>("Ringkasan");
  const [reflectionClass, setReflectionClass] = useState<string | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [classEditor, setClassEditor] = useState<ClassRecord | null | undefined>(undefined);
  const [detail, setDetail] = useState<ReflectionRecord | null>(null);
  const [followUp, setFollowUp] = useState<RescueRecord | null>(null);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [toast, setToast] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const outcomes = reflections.flatMap((item) => item.lesson_rescues.flatMap((plan) => plan.intervention_outcomes));
  const successful = outcomes.filter((item) => item.outcome === "successful").length;
  const successRate = outcomes.length ? Math.round((successful / outcomes.length) * 100) : 0;
  const pendingPlans = reflections.filter((item) => item.lesson_rescues.some((plan) => plan.intervention_outcomes.length === 0));
  const lowerQuery = query.toLocaleLowerCase("ms-MY");
  const searchClasses = classes.filter((item) => `${item.class_name} ${item.subject} ${item.year_level}`.toLocaleLowerCase("ms-MY").includes(lowerQuery));
  const searchReflections = reflections.filter((item) => `${item.topic || ""} ${item.subject || ""} ${item.transcript} ${item.class_summary || ""}`.toLocaleLowerCase("ms-MY").includes(lowerQuery));

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearch(true); }
      if (event.key === "Escape") { setSearch(false); setNotifications(false); }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  function openReflection(classId?: string) {
    if (!classes.length) { setToast("Tambah kelas dahulu sebelum membuat refleksi."); setView("Kelas saya"); return; }
    setReflectionClass(classId || classes[0].id); setShowReflection(true);
  }
  function savedClass(item: ClassRecord) {
    setClasses((current) => current.some((row) => row.id === item.id) ? current.map((row) => row.id === item.id ? item : row) : [...current, item]);
    setToast("Kelas berjaya disimpan.");
  }
  function deletedClass(id: string) {
    setClasses((current) => current.filter((row) => row.id !== id));
    setReflections((current) => current.filter((row) => row.class_id !== id));
    setToast("Kelas telah dipadam.");
  }
  function savedReflection(item: ReflectionRecord) {
    setReflections((current) => [item, ...current]); setToast("Refleksi dan Lesson Rescue berjaya disimpan.");
  }
  function savedOutcome(outcome: OutcomeRecord) {
    if (!followUp) return;
    setReflections((current) => current.map((reflection) => ({ ...reflection, lesson_rescues: reflection.lesson_rescues.map((plan) => plan.id === followUp.id ? { ...plan, intervention_outcomes: [outcome, ...plan.intervention_outcomes] } : plan) })));
    if (detail) setDetail((current) => current ? { ...current, lesson_rescues: current.lesson_rescues.map((plan) => plan.id === followUp.id ? { ...plan, intervention_outcomes: [outcome, ...plan.intervention_outcomes] } : plan) } : current);
    setToast("Hasil intervensi berjaya direkodkan.");
  }
  async function createDemo() {
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: demoClass, error } = await supabase.from("classes").insert({ teacher_id: auth.user.id, class_name: "3 Cemerlang", year_level: "Tahun 3", subject: "Matematik" }).select("id, class_name, year_level, subject, created_at").single();
    if (error) return setToast(error.message);
    const names = ["Ahmad", "Ali", "Sarah", "Aina", "Kumar"];
    const { data: students } = await supabase.from("students").insert(names.map((name, index) => ({ class_id: demoClass.id, display_name: name, student_code: `M${index + 1}` }))).select("id, display_name, student_code, active");
    savedClass({ ...demoClass, students: students || [] });
  }
  async function saveProfile(next: ProfileRecord) {
    setProfileBusy(true);
    const { error } = await createSupabaseBrowserClient().from("profiles").update({ display_name: next.display_name.trim(), school_name: next.school_name?.trim() || null, primary_subject: next.primary_subject?.trim() || null }).eq("id", next.id);
    setProfileBusy(false);
    if (error) return setToast(error.message);
    setProfile(next); setToast("Profil berjaya dikemas kini.");
  }

  const initials = profile.display_name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "GP";
  return <main className="app-shell">
    <aside className="sidebar">
      <button className="brand brand-button" onClick={() => setView("Ringkasan")}><div className="brand-mark"><span /><span /><span /></div><span>Class<span>Pulse</span></span></button>
      <div className="sidebar-section"><span className="sidebar-label">RUANG KERJA</span><nav>{nav.map((item) => <button key={item.label} className={`nav-item ${view === item.label ? "is-active" : ""}`} onClick={() => setView(item.label)}><i>{item.icon}</i><span>{item.label}</span>{item.label === "Memori pengajaran" && pendingPlans.length > 0 && <b className="nav-count">{pendingPlans.length}</b>}</button>)}</nav></div>
      <div className="sidebar-divider" /><button className={`nav-item ${view === "Tetapan" ? "is-active" : ""}`} onClick={() => setView("Tetapan")}><i>⚙</i><span>Tetapan</span></button>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-card__icon">✦</div><b>Petua minggu ini</b><p>Sebut bukti khusus seperti hasil latihan atau respons murid.</p><button onClick={() => openReflection()}>Cuba sekarang →</button></div><div className="profile"><div className="avatar avatar--sidebar">{initials}</div><div><b>{profile.display_name}</b><span>{profile.primary_subject || "Guru"}</span></div><SignOutButton /></div></div>
    </aside>
    <section className="content-area">
      <header className="topbar"><div><span className="topbar-kicker">{new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><h1>{view}</h1></div><div className="topbar-actions">
        <button className="search-trigger" onClick={() => setSearch(true)}>⌕ <span>Cari kelas atau refleksi…</span><kbd>Ctrl K</kbd></button>
        <div className="notification-wrap"><button className="top-icon" onClick={() => setNotifications((value) => !value)} aria-label="Notifikasi">♢{pendingPlans.length > 0 && <i />}</button>{notifications && <div className="notification-popover"><b>Notifikasi</b>{pendingPlans.length ? pendingPlans.slice(0, 3).map((item) => <button key={item.id} onClick={() => { setDetail(item); setNotifications(false); }}>Lesson Rescue “{item.topic || item.subject}” menunggu rekod hasil.</button>) : <p>Tiada tindakan tertunggak.</p>}</div>}</div>
        <button className="avatar" onClick={() => setView("Tetapan")} aria-label="Buka profil">{initials}</button>
      </div></header>
      <div className="dashboard-scroll">
        {view === "Ringkasan" && <Overview classes={classes} reflections={reflections} successRate={successRate} pending={pendingPlans.length} onReflect={openReflection} onView={setView} onDetail={setDetail} />}
        {view === "Kelas saya" && <ClassesView classes={classes} onNew={() => setClassEditor(null)} onEdit={setClassEditor} onReflect={openReflection} onDemo={createDemo} />}
        {view === "Sejarah refleksi" && <HistoryView reflections={reflections} classMap={classMap} onDetail={setDetail} onNew={() => openReflection()} />}
        {view === "Memori pengajaran" && <MemoryView reflections={reflections} onDetail={setDetail} onFollowUp={setFollowUp} onNew={() => openReflection()} />}
        {view === "Tetapan" && <SettingsView profile={profile} busy={profileBusy} onSave={saveProfile} />}
      </div>
    </section>
    {showReflection && <ReflectionWorkflow classes={classes} initialClassId={reflectionClass || undefined} onClose={() => setShowReflection(false)} onSaved={savedReflection} />}
    {classEditor !== undefined && <ClassManager item={classEditor} onClose={() => setClassEditor(undefined)} onSaved={savedClass} onDeleted={deletedClass} />}
    {detail && <ReflectionDetail item={detail} className={classMap.get(detail.class_id)?.class_name || "Kelas"} onClose={() => setDetail(null)} onFollowUp={(plan) => setFollowUp(plan)} />}
    {followUp && <FollowUpModal plan={followUp} onClose={() => setFollowUp(null)} onSaved={savedOutcome} />}
    {search && <SearchOverlay query={query} setQuery={setQuery} classes={searchClasses} reflections={searchReflections} classMap={classMap} onClose={() => setSearch(false)} onClass={(item) => { setClassEditor(item); setSearch(false); }} onReflection={(item) => { setDetail(item); setSearch(false); }} />}
    {toast && <button className="toast" onClick={() => setToast("")}>{toast}<span>×</span></button>}
  </main>;
}

function Overview({ classes, reflections, successRate, pending, onReflect, onView, onDetail }: { classes: ClassRecord[]; reflections: ReflectionRecord[]; successRate: number; pending: number; onReflect: (id?: string) => void; onView: (view: View) => void; onDetail: (item: ReflectionRecord) => void }) {
  const recent = reflections.slice(0, 3);
  return <><section className="hero-card"><div className="hero-card__copy"><span className="eyebrow eyebrow--light">RINGKASAN PENGAJARAN</span><h2>Satu refleksi kecil.<br /><em>Satu kelas yang lebih jelas.</em></h2><p>Rekod apa yang berlaku, sahkan analisis dan bawa Lesson Rescue ke kelas seterusnya.</p><button className="light-button" onClick={() => onReflect()}>Mulakan refleksi →</button></div><div className="hero-card__visual"><div className="orbit orbit--one" /><div className="orbit orbit--two" /><div className="hero-orb">●</div></div></section>
    <section className="metrics-grid"><Metric label="Kelas aktif" value={classes.length} detail={`${classes.reduce((sum, item) => sum + item.students.length, 0)} murid`} /><Metric label="Refleksi disimpan" value={reflections.length} detail="Rekod keseluruhan" /><Metric label="Intervensi berkesan" value={`${successRate}%`} detail={`${pending} menunggu susulan`} /></section>
    <div className="section-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">KELAS SAYA</span><h3>Pilih kelas untuk refleksi</h3></div><button className="ghost-button" onClick={() => onView("Kelas saya")}>Lihat semua →</button></div>{classes.length ? <div className="class-list">{classes.slice(0, 4).map((item) => <button className="class-row simple-row" key={item.id} onClick={() => onReflect(item.id)}><span className="class-accent class-accent--purple" /><div className="class-main"><div><b>{item.class_name}</b><span>{item.subject} · {item.students.length} murid</span></div></div><span className="row-action">Refleksi →</span></button>)}</div> : <Empty title="Belum ada kelas" text="Tambah kelas untuk mula membuat refleksi." action="Tambah kelas" onClick={() => onView("Kelas saya")} />}</section>
    <section className="panel pulse-panel"><div className="panel-heading"><div><span className="eyebrow">NADI PENGAJARAN</span><h3>Tindakan seterusnya</h3></div></div><div className="pulse-quote"><div className="quote-mark">“</div><p>{pending ? `${pending} Lesson Rescue belum mempunyai rekod hasil. Lengkapkan susulan supaya strategi seterusnya menjadi lebih tepat.` : reflections.length ? "Semua Lesson Rescue sudah mempunyai rekod susulan. Teruskan refleksi untuk membina pola." : "Pola pengajaran akan muncul selepas beberapa refleksi disimpan."}</p></div><button className="insight-link" onClick={() => onView("Memori pengajaran")}>Buka memori pengajaran →</button></section></div>
    <section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">TERKINI</span><h3>Refleksi terbaru</h3></div><button className="ghost-button" onClick={() => onView("Sejarah refleksi")}>Sejarah penuh →</button></div>{recent.length ? <div className="recent-grid">{recent.map((item) => <button className="recent-card" key={item.id} onClick={() => onDetail(item)}><div className="recent-card__top"><span>{new Date(item.recorded_at).toLocaleDateString("ms-MY")}</span><span>•••</span></div><h4>{item.topic || item.subject}</h4><p>{item.class_summary}</p><div className="recent-card__bottom"><span className="tag tag--amber">{item.analysis.learningIssues?.length || 0} isu</span><span>Lihat pelan →</span></div></button>)}</div> : <Empty title="Belum ada refleksi" text="Refleksi pertama anda akan muncul di sini." action="Mulakan refleksi" onClick={() => onReflect()} />}</section>
  </>;
}
function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) { return <div className="metric-card"><div className="metric-card__label"><span className="metric-icon metric-icon--purple">✦</span><span>{label}</span></div><div className="metric-card__value">{value}</div><p>{detail}</p></div>; }
function Empty({ title, text, action, onClick }: { title: string; text: string; action: string; onClick: () => void }) { return <div className="empty-state"><span>✦</span><h3>{title}</h3><p>{text}</p><button className="primary-button" onClick={onClick}>{action}</button></div>; }

function ClassesView({ classes, onNew, onEdit, onReflect, onDemo }: { classes: ClassRecord[]; onNew: () => void; onEdit: (item: ClassRecord) => void; onReflect: (id: string) => void; onDemo: () => void }) {
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">PENGURUSAN KELAS</span><h2>Kelas saya</h2><p>Cipta kelas, urus senarai murid dan mulakan refleksi.</p></div><button className="primary-button" onClick={onNew}>+ Tambah kelas</button></div>
    {classes.length ? <div className="class-card-grid">{classes.map((item) => <article className="class-card-full" key={item.id}><div className="class-card-icon">{item.class_name.slice(0, 1)}</div><span className="eyebrow">{item.year_level}</span><h3>{item.class_name}</h3><p>{item.subject}</p><div className="class-stat"><b>{item.students.length}</b><span>murid aktif</span></div><div className="card-actions"><button className="secondary-button" onClick={() => onEdit(item)}>Urus kelas</button><button className="primary-button" onClick={() => onReflect(item.id)}>Buat refleksi</button></div></article>)}</div> : <Empty title="Belum ada kelas" text="Muatkan data contoh atau tambah kelas sebenar anda." action="Muatkan kelas demo" onClick={onDemo} />}
  </section>;
}
function HistoryView({ reflections, classMap, onDetail, onNew }: { reflections: ReflectionRecord[]; classMap: Map<string, ClassRecord>; onDetail: (item: ReflectionRecord) => void; onNew: () => void }) {
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">REKOD LENGKAP</span><h2>Sejarah refleksi</h2><p>Semak transkrip, analisis dan Lesson Rescue yang telah disahkan.</p></div><button className="primary-button" onClick={onNew}>+ Refleksi baharu</button></div>
    {reflections.length ? <div className="history-list">{reflections.map((item) => <button className="history-row" key={item.id} onClick={() => onDetail(item)}><div className="history-date"><b>{new Date(item.recorded_at).getDate()}</b><span>{new Date(item.recorded_at).toLocaleDateString("ms-MY", { month: "short" })}</span></div><div><span className="eyebrow">{classMap.get(item.class_id)?.class_name || "Kelas"} · {item.subject}</span><h3>{item.topic || "Refleksi pengajaran"}</h3><p>{item.class_summary}</p></div><div className="history-meta"><span>{item.analysis.learningIssues?.length || 0} isu</span><b>→</b></div></button>)}</div> : <Empty title="Tiada sejarah lagi" text="Simpan refleksi pertama untuk membina rekod." action="Mulakan refleksi" onClick={onNew} />}
  </section>;
}
function MemoryView({ reflections, onDetail, onFollowUp, onNew }: { reflections: ReflectionRecord[]; onDetail: (item: ReflectionRecord) => void; onFollowUp: (item: RescueRecord) => void; onNew: () => void }) {
  const plans = reflections.flatMap((reflection) => reflection.lesson_rescues.map((plan) => ({ reflection, plan })));
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">KITARAN PENAMBAHBAIKAN</span><h2>Memori pengajaran</h2><p>Bandingkan strategi, hasil intervensi dan perkara yang perlu dicuba seterusnya.</p></div></div>
    {plans.length ? <div className="memory-grid">{plans.map(({ reflection, plan }) => { const last = plan.intervention_outcomes[0]; return <article className="memory-card" key={plan.id}><div className="memory-top"><span className={last ? "status-done" : "status-pending"}>{last ? outcomeLabels[last.outcome] : "Perlu susulan"}</span><span>{plan.duration_minutes} minit</span></div><h3>{plan.title}</h3><p>{plan.objective}</p><div className="memory-evidence"><span>Kelas</span><b>{reflection.subject} · {reflection.topic || "Tanpa topik"}</b></div><div className="card-actions"><button className="secondary-button" onClick={() => onDetail(reflection)}>Lihat pelan</button><button className="primary-button" onClick={() => onFollowUp(plan)}>{last ? "Tambah hasil" : "Rekod hasil"}</button></div></article>; })}</div> : <Empty title="Memori belum terbina" text="Lesson Rescue dan hasil intervensi akan muncul di sini." action="Mulakan refleksi" onClick={onNew} />}
  </section>;
}
function SettingsView({ profile, busy, onSave }: { profile: ProfileRecord; busy: boolean; onSave: (profile: ProfileRecord) => void }) {
  const [draft, setDraft] = useState(profile);
  return <section className="page-section settings-page"><div className="page-heading"><div><span className="eyebrow">AKAUN GURU</span><h2>Tetapan</h2><p>Kemas kini maklumat yang digunakan pada dashboard.</p></div></div><div className="settings-card"><label className="form-field"><span>Nama paparan</span><input value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} /></label><label className="form-field"><span>Nama sekolah</span><input value={draft.school_name || ""} onChange={(e) => setDraft({ ...draft, school_name: e.target.value })} placeholder="Nama sekolah" /></label><label className="form-field"><span>Subjek utama</span><input value={draft.primary_subject || ""} onChange={(e) => setDraft({ ...draft, primary_subject: e.target.value })} placeholder="Matematik" /></label><button className="primary-button" disabled={busy} onClick={() => onSave(draft)}>{busy ? "Menyimpan…" : "Simpan perubahan"}</button><div className="privacy-settings"><b>Privasi</b><p>Audio kekal pada peranti dan tidak disimpan ke pangkalan data. Hanya transkrip yang anda sahkan disimpan.</p></div></div></section>;
}
function SearchOverlay({ query, setQuery, classes, reflections, classMap, onClose, onClass, onReflection }: { query: string; setQuery: (value: string) => void; classes: ClassRecord[]; reflections: ReflectionRecord[]; classMap: Map<string, ClassRecord>; onClose: () => void; onClass: (item: ClassRecord) => void; onReflection: (item: ReflectionRecord) => void }) {
  return <div className="modal-backdrop search-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="search-modal"><div className="search-input"><span>⌕</span><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari kelas, subjek, topik atau isi refleksi…" /><button onClick={onClose}>Esc</button></div><div className="search-results">{query ? <>{classes.map((item) => <button key={item.id} onClick={() => onClass(item)}><span>▤</span><div><b>{item.class_name}</b><small>{item.subject} · {item.students.length} murid</small></div></button>)}{reflections.map((item) => <button key={item.id} onClick={() => onReflection(item)}><span>◷</span><div><b>{item.topic || item.subject}</b><small>{classMap.get(item.class_id)?.class_name} · {item.class_summary}</small></div></button>)}{!classes.length && !reflections.length && <p>Tiada hasil ditemui.</p>}</> : <p>Taip untuk mencari semua rekod ClassPulse.</p>}</div></section></div>;
}

