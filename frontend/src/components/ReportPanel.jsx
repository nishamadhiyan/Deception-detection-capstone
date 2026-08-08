import { Stamp, X } from "lucide-react";

export default function ReportPanel({ report, onClose }) {
  if (!report) return null;

  const deceptive = report.overall_verdict === "Deceptive Indicators";

  return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <button style={styles.close} onClick={onClose} aria-label="Close report">
          <X size={16} />
        </button>

        <div className="mono" style={styles.kicker}>SESSION REPORT — FINAL</div>
        <h2 className="stamp" style={styles.title}>Case Findings</h2>

        <div
          style={{
            ...styles.stampBox,
            borderColor: deceptive ? "var(--evidence-red-bright)" : "var(--verified-teal-bright)",
            color: deceptive ? "var(--evidence-red-bright)" : "var(--verified-teal-bright)",
          }}
        >
          <Stamp size={18} />
          <span className="stamp" style={styles.stampText}>
            {deceptive ? "DECEPTIVE INDICATORS" : "TRUTHFUL INDICATORS"}
          </span>
        </div>

        <div style={styles.grid}>
          <Stat label="Frames analyzed" value={report.frames_analyzed} />
          <Stat label="Avg. deception probability" value={`${(report.avg_deception_probability * 100).toFixed(1)}%`} />
          <Stat label="Flagged frames" value={`${report.flagged_frame_pct}%`} />
          <Stat label="Session duration" value={`${report.session_duration_sec}s`} />
        </div>

        {report.peak_moment && (
          <div style={styles.peakBox}>
            <div className="mono" style={styles.peakLabel}>PEAK ANOMALY</div>
            <div className="mono" style={styles.peakDetail}>
              {(report.peak_moment.deception_probability * 100).toFixed(1)}% probability ·
              {" "}blink {report.peak_moment.blink_rate_per_min}/min ·
              {" "}gaze {report.peak_moment.gaze_ratio}
            </div>
          </div>
        )}

        <p style={styles.disclaimer}>
          Generated from facial micro-feature analysis (EAR, MAR, gaze, head pose, blink rate).
          This is an academic demonstration, not a validated forensic instrument.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div className="mono" style={styles.statLabel}>{label}</div>
      <div className="mono" style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(6, 7, 6, 0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 50,
  },
  sheet: {
    position: "relative",
    background: "var(--file-cream)",
    color: "var(--ink)",
    maxWidth: 480,
    width: "100%",
    padding: "32px 30px",
    borderRadius: 3,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  close: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "transparent",
    border: "none",
    color: "var(--ink-soft)",
  },
  kicker: {
    fontSize: 10.5,
    letterSpacing: "0.12em",
    color: "var(--ink-soft)",
  },
  title: {
    fontSize: 26,
    margin: "6px 0 18px",
    color: "var(--ink)",
  },
  stampBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "2px solid",
    borderRadius: 3,
    padding: "8px 14px",
    transform: "rotate(-2deg)",
    marginBottom: 20,
  },
  stampText: { fontSize: 14, letterSpacing: "0.04em" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 18,
  },
  stat: {
    background: "rgba(0,0,0,0.04)",
    padding: "10px 12px",
    borderRadius: 2,
  },
  statLabel: { fontSize: 9.5, color: "var(--ink-soft)", marginBottom: 4, letterSpacing: "0.04em" },
  statValue: { fontSize: 17, fontWeight: 700 },
  peakBox: {
    borderTop: "1px dashed var(--file-shadow)",
    paddingTop: 12,
    marginBottom: 16,
  },
  peakLabel: { fontSize: 9.5, letterSpacing: "0.08em", color: "var(--ink-soft)", marginBottom: 4 },
  peakDetail: { fontSize: 11.5, color: "var(--ink)" },
  disclaimer: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: "var(--ink-soft)",
    fontStyle: "italic",
  },
};
