"""
classifier.py
--------------
Loads the trained SVM/MLP model + scaler and turns a feature vector into
a deception probability + verdict. Falls back to a rule-based heuristic
if no trained model file is present yet (so the API never hard-fails).
"""

import os
import joblib
import numpy as np

from constants import FEATURE_ORDER
from feature_extraction import features_to_vector

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "deception_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")


class DeceptionClassifier:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.loaded = False
        self._try_load()

    def _try_load(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
            self.loaded = True

    def predict(self, feature_dict):
        vec = features_to_vector(feature_dict)

        if self.loaded:
            scaled = self.scaler.transform(vec)
            proba = self.model.predict_proba(scaled)[0]
            # class 1 = deceptive
            deception_prob = float(proba[1])
            source = "model"
        else:
            deception_prob = self._heuristic_score(feature_dict)
            source = "heuristic"

        verdict = "Deceptive Indicators" if deception_prob >= 0.5 else "Truthful Indicators"
        confidence = round(abs(deception_prob - 0.5) * 200, 1)  # 0-100 scale

        return {
            "deception_probability": round(deception_prob, 4),
            "verdict": verdict,
            "confidence_pct": confidence,
            "source": source,
        }

    @staticmethod
    def _heuristic_score(f):
        """
        Simple weighted-cue fallback, grounded in the deception-cue literature:
        elevated blink rate, gaze aversion, and reduced EAR (eye tension)
        under stress; used only until a trained model is deployed.
        """
        score = 0.0
        blink = f.get("blink_rate_per_min", 15)
        gaze = f.get("gaze_ratio", 0.5)
        ear = f.get("ear", 0.3)
        mar = f.get("mar", 0.3)

        score += np.clip((blink - 17) / 25, -0.3, 0.3)
        score += np.clip(abs(gaze - 0.5) - 0.08, 0, 0.3) * 1.5
        score += np.clip((0.24 - ear) / 0.1, -0.2, 0.25)
        score += np.clip((mar - 0.35) / 0.4, -0.1, 0.2)

        return float(np.clip(0.5 + score, 0.02, 0.98))


classifier = DeceptionClassifier()
