import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import WebcamPanel from "./components/WebcamPanel";
import MetricsPanel from "./components/MetricsPanel";
import VerdictGauge from "./components/VerdictGauge";
import CaseLog from "./components/CaseLog";
import ReportPanel from "./components/ReportPanel";
import { api } from "./lib/api";

const ANALYZE_INTERVAL_MS = 900;

function randomCaseId() {
  return Math.floor(100000 + Math.random() * 899999);
}

export default function App() {
  const [caseId] = useState(randomCaseId);
  const [apiOnline, setApiOnline] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [latest, setLatest] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));

  useEffect(() => {
    api
      .health()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  const captureFrame = useCallback(() => {
    const video = window.__veritasVideoEl;
    if (!video || video.readyState < 2) return null;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const tick = useCallback(async () => {
    const sid = sessionId;
    if (!sid) return;
    const frame = captureFrame();
    if (!frame) return;

    try {
      const result = await api.analyzeFrame(sid, frame);
      if (!result.face_detected) {
        setLatest((prev) => (prev ? { ...prev, face_detected: false } : null));
        return;
      }
      setLatest(result);
      const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
      const deceptive = result.deception_probability >= 0.5;
      setLogEntries((prev) =>
        [
          ...prev,
          {
            time,
            deceptive,
            detail: `p=${result.deception_probability.toFixed(2)} · blink ${result.blink_rate_per_min}/min · gaze ${result.gaze_ratio}`,
          },
        ].slice(-60)
      );
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId, captureFrame]);

  useEffect(() => {
    if (sessionActive) {
      intervalRef.current = setInterval(tick, ANALYZE_INTERVAL_MS);
    }
    return () => clearInterval(intervalRef.current);
  }, [sessionActive, tick]);

  async function handleStart() {
    setError(null);
    setLogEntries([]);
    setLatest(null);
    setReport(null);
    try {
      const { session_id } = await api.startSession();
      setSessionId(session_id);
      setSessionActive(true);
      setApiOnline(true);
    } catch (err) {
      setError("Could not reach the analysis backend. " + err.message);
      setApiOnline(false);
    }
  }

  async function handleStop() {
    setSessionActive(false);
    clearInterval(intervalRef.current);
    if (!sessionId) return;
    try {
      const rep = await api.getReport(sessionId);
      setReport(rep);
      await api.endSession(sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSessionId(null);
    }
  }

  return (
    <div style={styles.app}>
      <Header caseId={caseId} apiOnline={apiOnline} sessionActive={sessionActive} />

      <main style={styles.main}>
        {error && (
          <div className="mono" style={styles.errorBanner}>
            ⚠ {error}
            {!apiOnline && " — is the Flask backend running and VITE_API_URL set correctly?"}
          </div>
        )}

        <div style={styles.grid}>
          <div style={styles.leftCol}>
            <WebcamPanel
              sessionActive={sessionActive}
              onStart={handleStart}
              onStop={handleStop}
              faceDetected={latest?.face_detected !== false}
            />
            <CaseLog entries={logEntries} />
          </div>

          <div style={styles.rightCol}>
            <VerdictGauge latest={latest} active={sessionActive} />
            <MetricsPanel latest={latest} />
          </div>
        </div>

        <footer className="mono" style={styles.footer}>
          VERITAS CONSOLE · Smart Deception Detection Using Computer Vision · Academic demonstration only
        </footer>
      </main>

      <ReportPanel report={report} onClose={() => setReport(null)} />
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    maxWidth: 1180,
    width: "100%",
    margin: "0 auto",
    padding: "24px 20px 40px",
  },
  errorBanner: {
    background: "rgba(176, 46, 38, 0.12)",
    border: "1px solid var(--evidence-red)",
    color: "var(--evidence-red-bright)",
    fontSize: 12,
    padding: "10px 14px",
    borderRadius: 2,
    marginBottom: 18,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
    gap: 18,
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: 18 },
  rightCol: { display: "flex", flexDirection: "column", gap: 18 },
  footer: {
    marginTop: 32,
    fontSize: 10,
    letterSpacing: "0.08em",
    color: "var(--text-faint)",
    textAlign: "center",
  },
};
