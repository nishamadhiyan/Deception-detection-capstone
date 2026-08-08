"""
app.py
------
Flask REST API for the Smart Deception Detection system.

Endpoints:
  GET  /api/health                 -> service + model status
  POST /api/session/start          -> creates a session, returns session_id
  POST /api/session/<id>/analyze   -> body: {"frame": "<base64 jpeg>"}
                                       returns per-frame features + verdict
  GET  /api/session/<id>/report    -> aggregated session report
  POST /api/session/<id>/end       -> closes session, frees resources
"""

import base64
import io
import time
import uuid

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

from feature_extraction import DeceptionFeatureExtractor
from classifier import classifier

import os

app = Flask(__name__)
_allowed_origin = os.environ.get("ALLOWED_ORIGIN")  # e.g. https://your-app.vercel.app
CORS(app, origins=[_allowed_origin] if _allowed_origin else "*")

# In-memory session store: {session_id: {"extractor":..., "history": [...], "created": ts}}
SESSIONS = {}
SESSION_TTL_SECONDS = 60 * 30  # 30 min idle timeout


def _cleanup_sessions():
    now = time.time()
    dead = [sid for sid, s in SESSIONS.items() if now - s["last_seen"] > SESSION_TTL_SECONDS]
    for sid in dead:
        SESSIONS[sid]["extractor"].close()
        del SESSIONS[sid]


def _decode_frame(b64_str):
    if "," in b64_str:  # strip data URL prefix if present
        b64_str = b64_str.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_str)
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return frame


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": classifier.loaded,
        "model_source": "trained" if classifier.loaded else "heuristic-fallback",
        "active_sessions": len(SESSIONS),
    })


@app.route("/api/session/start", methods=["POST"])
def start_session():
    _cleanup_sessions()
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "extractor": DeceptionFeatureExtractor(),
        "history": [],
        "created": time.time(),
        "last_seen": time.time(),
    }
    return jsonify({"session_id": session_id})


@app.route("/api/session/<session_id>/analyze", methods=["POST"])
def analyze(session_id):
    session = SESSIONS.get(session_id)
    if not session:
        return jsonify({"error": "unknown or expired session_id"}), 404

    data = request.get_json(silent=True) or {}
    b64_frame = data.get("frame")
    if not b64_frame:
        return jsonify({"error": "missing 'frame' (base64 jpeg) in body"}), 400

    frame = _decode_frame(b64_frame)
    if frame is None:
        return jsonify({"error": "could not decode frame"}), 400

    features = session["extractor"].process_frame(frame)
    session["last_seen"] = time.time()

    if not features.get("face_detected"):
        return jsonify({"face_detected": False})

    verdict = classifier.predict(features)
    record = {**features, **verdict}
    session["history"].append(record)

    return jsonify(record)


@app.route("/api/session/<session_id>/report", methods=["GET"])
def report(session_id):
    session = SESSIONS.get(session_id)
    if not session:
        return jsonify({"error": "unknown or expired session_id"}), 404

    history = session["history"]
    if not history:
        return jsonify({"frames_analyzed": 0, "summary": "No frames analyzed yet."})

    probs = [h["deception_probability"] for h in history]
    avg_prob = sum(probs) / len(probs)
    flagged = sum(1 for p in probs if p >= 0.5)

    peak = max(history, key=lambda h: h["deception_probability"])

    return jsonify({
        "frames_analyzed": len(history),
        "avg_deception_probability": round(avg_prob, 4),
        "flagged_frame_pct": round(100 * flagged / len(history), 1),
        "overall_verdict": "Deceptive Indicators" if avg_prob >= 0.5 else "Truthful Indicators",
        "peak_moment": {
            "timestamp": peak["timestamp"],
            "deception_probability": peak["deception_probability"],
            "blink_rate_per_min": peak.get("blink_rate_per_min"),
            "gaze_ratio": peak.get("gaze_ratio"),
        },
        "session_duration_sec": round(history[-1]["timestamp"] - history[0]["timestamp"], 1),
    })


@app.route("/api/session/<session_id>/end", methods=["POST"])
def end_session(session_id):
    session = SESSIONS.pop(session_id, None)
    if session:
        session["extractor"].close()
    return jsonify({"ended": bool(session)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
