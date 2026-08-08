import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";

export default function CaseLog({ entries }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div style={styles.panel}>
      <div style={styles.tab}>
        <FileText size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        CASE LOG — FRAME-BY-FRAME
      </div>
      <div ref={scrollRef} style={styles.scroll}>
        {entries.length === 0 && (
          <div className="mono" style={styles.empty}>No entries logged yet.</div>
        )}
        {entries.map((e, i) => (
          <div key={i} style={styles.row}>
            <span className="mono" style={styles.time}>{e.time}</span>
            <span
              className="mono"
              style={{
                ...styles.badge,
                color: e.deceptive ? "var(--evidence-red-bright)" : "var(--verified-teal-bright)",
                borderColor: e.deceptive ? "var(--evidence-red)" : "var(--verified-teal)",
              }}
            >
              {e.deceptive ? "FLAG" : "CLEAR"}
            </span>
            <span className="mono" style={styles.detail}>{e.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    background: "var(--desk-900)",
    border: "1px solid var(--desk-line)",
    borderRadius: "var(--radius-file)",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  tab: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "var(--text-dim)",
    padding: "10px 14px",
    borderBottom: "1px solid var(--desk-line)",
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 14px",
    maxHeight: 260,
  },
  empty: {
    fontSize: 11,
    color: "var(--text-faint)",
    padding: "10px 0",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 0",
    borderBottom: "1px solid var(--desk-800)",
  },
  time: { fontSize: 10.5, color: "var(--text-faint)", width: 64, flexShrink: 0 },
  badge: {
    fontSize: 9.5,
    letterSpacing: "0.06em",
    border: "1px solid",
    borderRadius: 2,
    padding: "1px 6px",
    flexShrink: 0,
  },
  detail: { fontSize: 11, color: "var(--text-dim)" },
};
