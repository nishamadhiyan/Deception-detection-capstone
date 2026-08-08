import { useEffect, useState } from "react";
import { ShieldAlert, Circle } from "lucide-react";

export default function Header({ caseId, apiOnline, sessionActive }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toUTCString().split(" ")[4];
  const dateStr = now.toISOString().slice(0, 10).replaceAll("-", ".");

  return (
    <header style={styles.wrap}>
      <div style={styles.left}>
        <ShieldAlert size={26} color="var(--evidence-red-bright)" strokeWidth={1.75} />
        <div>
          <div className="stamp" style={styles.title}>VERITAS</div>
          <div className="mono" style={styles.subtitle}>DECEPTION ANALYSIS CONSOLE</div>
        </div>
      </div>

      <div style={styles.right}>
        <div className="mono" style={styles.caseNo}>
          CASE&nbsp;#{caseId}
        </div>
        <div className="mono" style={styles.clock}>
          {dateStr} · {timeStr} UTC
        </div>
        <div style={styles.statusRow}>
          <span style={styles.statusItem}>
            <Circle size={9} fill={apiOnline ? "var(--verified-teal-bright)" : "var(--evidence-red-bright)"}
                    color={apiOnline ? "var(--verified-teal-bright)" : "var(--evidence-red-bright)"} />
            <span className="mono" style={styles.statusText}>{apiOnline ? "API LINKED" : "API OFFLINE"}</span>
          </span>
          <span style={styles.statusItem}>
            <Circle size={9} fill={sessionActive ? "var(--amber-flag)" : "var(--text-faint)"}
                    color={sessionActive ? "var(--amber-flag)" : "var(--text-faint)"} />
            <span className="mono" style={styles.statusText}>{sessionActive ? "RECORDING" : "STANDBY"}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

const styles = {
  wrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 28px",
    borderBottom: "1px solid var(--desk-line)",
    background: "linear-gradient(180deg, var(--desk-900), var(--desk-950))",
    flexWrap: "wrap",
    gap: 16,
  },
  left: { display: "flex", alignItems: "center", gap: 12 },
  title: {
    fontSize: 26,
    letterSpacing: "0.08em",
    color: "var(--text-primary)",
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: "0.15em",
    color: "var(--text-dim)",
    marginTop: 4,
  },
  right: { textAlign: "right" },
  caseNo: { fontSize: 13, color: "var(--amber-flag)", fontWeight: 600, letterSpacing: "0.05em" },
  clock: { fontSize: 11, color: "var(--text-dim)", marginTop: 4 },
  statusRow: { display: "flex", gap: 14, marginTop: 8, justifyContent: "flex-end" },
  statusItem: { display: "flex", alignItems: "center", gap: 6 },
  statusText: { fontSize: 10, letterSpacing: "0.08em", color: "var(--text-dim)" },
};
