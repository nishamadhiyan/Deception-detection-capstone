import { AlertTriangle, ShieldCheck, CircleDashed } from "lucide-react";

export default function VerdictGauge({ latest, active }) {
  const prob = latest?.deception_probability;
  const has = typeof prob === "number";
  const pct = has ? Math.round(prob * 100) : 0;

  // semicircle gauge geometry
  const r = 70;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  const color = !has
    ? "var(--text-faint)"
    : prob >= 0.5
    ? "var(--evidence-red-bright)"
    : "var(--verified-teal-bright)";

  return (
    <div style={styles.panel}>
      <div style={styles.tab}>EXHIBIT C — DECEPTION INDEX</div>
      <div style={styles.body}>
        <svg viewBox="0 0 170 95" width="220" height="124">
          <path
            d="M 15 90 A 70 70 0 0 1 155 90"
            fill="none"
            stroke="var(--desk-700)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 15 90 A 70 70 0 0 1 155 90"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }}
          />
          <text x="85" y="72" textAnchor="middle" className="mono" fontSize="30" fontWeight="700" fill={color}>
            {has ? `${pct}%` : "—"}
          </text>
        </svg>

        <div style={{ ...styles.verdictRow, color }}>
          {!has ? (
            <>
              <CircleDashed size={16} />
              <span className="mono" style={styles.verdictText}>AWAITING SIGNAL</span>
            </>
          ) : prob >= 0.5 ? (
            <>
              <AlertTriangle size={16} />
              <span className="mono" style={styles.verdictText}>DECEPTIVE INDICATORS</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span className="mono" style={styles.verdictText}>TRUTHFUL INDICATORS</span>
            </>
          )}
        </div>
        {has && (
          <div className="mono" style={styles.confidence}>
            CONFIDENCE {latest.confidence_pct}% · SRC: {latest.source?.toUpperCase()}
          </div>
        )}
        {!active && (
          <div className="mono" style={styles.hint}>Begin analysis to populate this exhibit.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    background: "var(--desk-900)",
    border: "1px solid var(--desk-line)",
    borderRadius: "var(--radius-file)",
  },
  tab: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "var(--text-dim)",
    padding: "10px 14px",
    borderBottom: "1px solid var(--desk-line)",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "18px 14px 22px",
  },
  verdictRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  verdictText: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.06em",
  },
  confidence: {
    fontSize: 10.5,
    color: "var(--text-faint)",
    marginTop: 8,
  },
  hint: {
    fontSize: 10.5,
    color: "var(--text-faint)",
    marginTop: 10,
    textAlign: "center",
  },
};
