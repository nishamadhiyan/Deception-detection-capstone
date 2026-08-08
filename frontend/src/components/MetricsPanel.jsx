import { Activity } from "lucide-react";

const METRIC_DEFS = [
  { key: "ear", label: "EYE APERTURE (EAR)", normal: [0.24, 0.34], fmt: (v) => v.toFixed(3) },
  { key: "mar", label: "MOUTH RATIO (MAR)", normal: [0.15, 0.45], fmt: (v) => v.toFixed(3) },
  { key: "gaze_ratio", label: "GAZE DEVIATION", normal: [0.42, 0.58], fmt: (v) => v.toFixed(3) },
  { key: "blink_rate_per_min", label: "BLINK RATE /MIN", normal: [10, 22], fmt: (v) => v.toFixed(1) },
  { key: "head_yaw", label: "HEAD YAW (°)", normal: [-12, 12], fmt: (v) => v.toFixed(1) },
  { key: "head_pitch", label: "HEAD PITCH (°)", normal: [-12, 12], fmt: (v) => v.toFixed(1) },
];

function isOutOfRange(val, [lo, hi]) {
  return val < lo || val > hi;
}

export default function MetricsPanel({ latest }) {
  return (
    <div style={styles.panel}>
      <div style={styles.tab}>
        <Activity size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        EXHIBIT B — BIOMETRIC READOUT
      </div>
      <div style={styles.grid}>
        {METRIC_DEFS.map((m) => {
          const raw = latest?.[m.key];
          const has = typeof raw === "number";
          const flagged = has && isOutOfRange(raw, m.normal);
          return (
            <div key={m.key} style={styles.cell}>
              <div className="mono" style={styles.label}>{m.label}</div>
              <div
                className="mono"
                style={{
                  ...styles.value,
                  color: !has
                    ? "var(--text-faint)"
                    : flagged
                    ? "var(--amber-flag)"
                    : "var(--verified-teal-bright)",
                }}
              >
                {has ? m.fmt(raw) : "——"}
              </div>
              <div style={styles.bar}>
                <div
                  style={{
                    ...styles.barFill,
                    width: has ? "100%" : "0%",
                    background: flagged ? "var(--amber-flag)" : "var(--verified-teal)",
                    opacity: has ? 0.85 : 0,
                  }}
                />
              </div>
            </div>
          );
        })}
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 1,
    background: "var(--desk-line)",
  },
  cell: {
    background: "var(--desk-900)",
    padding: "14px 16px",
  },
  label: {
    fontSize: 9.5,
    letterSpacing: "0.08em",
    color: "var(--text-faint)",
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
  },
  bar: {
    height: 3,
    background: "var(--desk-800)",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    transition: "width 0.4s ease, background 0.4s ease",
  },
};
