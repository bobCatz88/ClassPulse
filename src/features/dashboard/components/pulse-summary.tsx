import type { ClassPulse, ClassRecord } from "@/features/dashboard/types";
import { pulseColor, pulseLabel } from "@/features/pulse/pulse-utils";

export function PulseSummary({ pulses, classes, onRecord }: { pulses: ClassPulse[]; classes: ClassRecord[]; onRecord: () => void }) {
  const latest = pulses[0];
  const className = latest ? classes.find((item) => item.id === latest.class_id)?.class_name || "Kelas" : "";
  return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">PULSE KELAS</span><h3>Keadaan pengajaran terkini</h3></div><button className="ghost-button" onClick={onRecord}>{latest ? "Kemas kini →" : "Catat Pulse →"}</button></div>
    {latest ? <><div style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 12, background: `${pulseColor(latest.understanding)}16`, borderLeft: `4px solid ${pulseColor(latest.understanding)}` }}><span aria-hidden="true" style={{ width: 13, height: 13, borderRadius: "50%", background: pulseColor(latest.understanding), flex: "0 0 auto" }} /><div><b>{pulseLabel(latest.understanding)} · {className}</b><p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 12 }}>Penglibatan {latest.engagement === "high" ? "tinggi" : latest.engagement === "low" ? "rendah" : "bercampur"} · Tenaga {latest.energy_level === "normal" ? "biasa" : latest.energy_level}</p></div></div>{latest.note && <p className="muted-copy" style={{ margin: "11px 0 0" }}>{latest.note}</p>}
      <div aria-label="Trend tujuh Pulse terakhir" style={{ display: "flex", alignItems: "end", gap: 7, height: 54, marginTop: 14 }}>{pulses.slice(0, 7).reverse().map((pulse) => <span key={pulse.id} title={`${pulseLabel(pulse.understanding)} · ${new Date(pulse.observed_at).toLocaleDateString("ms-MY")}`} style={{ display: "block", width: 20, height: pulse.understanding === "strong" ? 48 : pulse.understanding === "mixed" ? 31 : 17, borderRadius: 5, background: pulseColor(pulse.understanding), transition: "height 160ms ease" }} />)}</div></> : <p className="muted-copy">Belum ada Pulse. Catat keadaan kelas dalam beberapa saat selepas mengajar.</p>}
  </section>;
}
