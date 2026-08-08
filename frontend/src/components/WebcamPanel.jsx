import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Play, Square } from "lucide-react";

export default function WebcamPanel({ sessionActive, onStart, onStop, faceDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamReady(true);
    } catch (err) {
      setCamError("Camera access denied or unavailable.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  // Expose the video element ref up via a global-ish approach: parent reads via getVideoEl callback
  useEffect(() => {
    if (camReady && videoRef.current) {
      window.__veritasVideoEl = videoRef.current;
    }
  }, [camReady]);

  return (
    <div style={styles.panel}>
      <div style={styles.tab}>EXHIBIT A — LIVE FEED</div>
      <div style={styles.frameWrap}>
        {camError ? (
          <div style={styles.errorBox}>
            <VideoOff size={32} color="var(--evidence-red-bright)" />
            <p className="mono" style={{ fontSize: 12, marginTop: 10 }}>{camError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
            <div style={{
              ...styles.faceIndicator,
              borderColor: faceDetected ? "var(--verified-teal-bright)" : "var(--text-faint)",
              opacity: sessionActive ? 1 : 0,
            }} />
            <div style={styles.corner1} />
            <div style={styles.corner2} />
            <div style={styles.corner3} />
            <div style={styles.corner4} />
          </>
        )}
      </div>

      <div style={styles.controls}>
        {!sessionActive ? (
          <button style={styles.startBtn} onClick={onStart} disabled={!camReady}>
            <Play size={14} /> BEGIN ANALYSIS
          </button>
        ) : (
          <button style={styles.stopBtn} onClick={onStop}>
            <Square size={14} /> END SESSION
          </button>
        )}
        <span className="mono" style={styles.hint}>
          <Video size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          {camReady ? "Feed nominal" : "Initializing camera…"}
        </span>
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
  frameWrap: {
    position: "relative",
    aspectRatio: "4 / 3",
    background: "#000",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
    filter: "contrast(1.05) saturate(0.9)",
  },
  errorBox: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-dim)",
  },
  faceIndicator: {
    position: "absolute",
    top: "18%",
    left: "28%",
    width: "44%",
    height: "64%",
    border: "1.5px solid",
    borderRadius: "40% 40% 45% 45%",
    transition: "border-color 0.3s ease, opacity 0.3s ease",
    pointerEvents: "none",
  },
  corner1: { position: "absolute", top: 8, left: 8, width: 16, height: 16, borderTop: "2px solid var(--amber-flag)", borderLeft: "2px solid var(--amber-flag)" },
  corner2: { position: "absolute", top: 8, right: 8, width: 16, height: 16, borderTop: "2px solid var(--amber-flag)", borderRight: "2px solid var(--amber-flag)" },
  corner3: { position: "absolute", bottom: 8, left: 8, width: 16, height: 16, borderBottom: "2px solid var(--amber-flag)", borderLeft: "2px solid var(--amber-flag)" },
  corner4: { position: "absolute", bottom: 8, right: 8, width: 16, height: 16, borderBottom: "2px solid var(--amber-flag)", borderRight: "2px solid var(--amber-flag)" },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    flexWrap: "wrap",
    gap: 10,
  },
  startBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--verified-teal)", color: "#0b0d0c",
    border: "none", padding: "9px 16px", borderRadius: 2,
    fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
  },
  stopBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--evidence-red)", color: "#f4ede0",
    border: "none", padding: "9px 16px", borderRadius: 2,
    fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
  },
  hint: { fontSize: 10.5, color: "var(--text-faint)" },
};
