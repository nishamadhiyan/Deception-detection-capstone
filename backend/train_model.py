"""
train_model.py
---------------
Trains the SVM + MLP classifiers on labeled feature data and saves the
best-performing model + scaler to backend/models/.

USAGE
-----
1. Real dataset (recommended for your report/demo):
   Put a CSV at backend/data/features.csv with columns:
   ear,mar,gaze_ratio,head_pitch,head_yaw,head_roll,blink_rate_per_min,label
   where label = 1 (deceptive) or 0 (truthful). Extract these per-clip using
   feature_extraction.DeceptionFeatureExtractor over your labeled video
   dataset (e.g. the Real-life Trial / Box-of-Lies style corpora), then run:

       python train_model.py --csv data/features.csv

2. No dataset yet / just want the pipeline running end-to-end:

       python train_model.py --synthetic

   This generates a synthetic-but-plausible dataset from the same feature
   distributions reported in the deception-cue literature (elevated blink
   rate + gaze aversion + eye tension under deception) purely so the full
   stack (frontend -> API -> model -> verdict) is demonstrable. Swap in
   real data before treating results as a genuine research contribution.
"""

import argparse
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report

from constants import FEATURE_ORDER

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def make_synthetic_dataset(n=1200, seed=42):
    rng = np.random.default_rng(seed)
    n_truth = n // 2
    n_lie = n - n_truth

    truth = pd.DataFrame({
        "ear": rng.normal(0.29, 0.03, n_truth),
        "mar": rng.normal(0.32, 0.05, n_truth),
        "gaze_ratio": rng.normal(0.5, 0.05, n_truth),
        "head_pitch": rng.normal(0, 4, n_truth),
        "head_yaw": rng.normal(0, 4, n_truth),
        "head_roll": rng.normal(0, 3, n_truth),
        "blink_rate_per_min": rng.normal(15, 3, n_truth),
        "label": 0,
    })

    lie = pd.DataFrame({
        "ear": rng.normal(0.24, 0.035, n_lie),
        "mar": rng.normal(0.38, 0.07, n_lie),
        "gaze_ratio": rng.normal(0.5, 0.14, n_lie),
        "head_pitch": rng.normal(0, 7, n_lie),
        "head_yaw": rng.normal(0, 8, n_lie),
        "head_roll": rng.normal(0, 5, n_lie),
        "blink_rate_per_min": rng.normal(23, 6, n_lie),
        "label": 1,
    })

    df = pd.concat([truth, lie], ignore_index=True).sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


def train(df):
    X = df[FEATURE_ORDER].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    candidates = {
        "svm": SVC(kernel="rbf", C=2.0, gamma="scale", probability=True, random_state=42),
        "mlp": MLPClassifier(hidden_layer_sizes=(32, 16), activation="relu",
                              max_iter=2000, random_state=42, early_stopping=True),
    }

    results = {}
    for name, model in candidates.items():
        model.fit(X_train_s, y_train)
        preds = model.predict(X_test_s)
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds)
        results[name] = {"model": model, "acc": acc, "f1": f1}
        print(f"\n=== {name.upper()} ===")
        print(f"Accuracy: {acc:.4f}  F1: {f1:.4f}")
        print(classification_report(y_test, preds, target_names=["truthful", "deceptive"]))

    best_name = max(results, key=lambda k: results[k]["f1"])
    best_model = results[best_name]["model"]
    print(f"\nBest model: {best_name} (F1={results[best_name]['f1']:.4f}) -> saving.")

    joblib.dump(best_model, os.path.join(MODEL_DIR, "deception_model.joblib"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.joblib"))
    print(f"Saved to {MODEL_DIR}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=str, default=None, help="Path to labeled feature CSV")
    parser.add_argument("--synthetic", action="store_true", help="Train on generated synthetic data")
    args = parser.parse_args()

    if args.csv:
        dataframe = pd.read_csv(args.csv)
    else:
        print("No --csv provided: generating synthetic demo dataset (1200 samples)...")
        dataframe = make_synthetic_dataset()

    train(dataframe)
