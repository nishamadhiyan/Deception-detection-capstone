"""
feature_extraction.py
----------------------
Extracts forensic facial micro-features from video frames using MediaPipe
Face Mesh: Eye Aspect Ratio (EAR), Mouth Aspect Ratio (MAR), gaze ratio,
blink rate, and head pose (pitch/yaw/roll).

These are the same feature families used in the deception-detection
literature (e.g. Ekman's micro-expression work, and EAR/MAR-based
drowsiness & stress detection papers).
"""

import math
import time
from collections import deque

import cv2
import numpy as np
import mediapipe as mp

from constants import FEATURE_ORDER

mp_face_mesh = mp.solutions.face_mesh

# ---- Landmark index groups (MediaPipe FaceMesh, 468-point topology) ----
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
MOUTH = [61, 291, 39, 181, 0, 17, 269, 405]
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]

# 3D model points for head-pose (solvePnP), matched to landmark indices below
HEAD_POSE_LANDMARKS = [1, 152, 33, 263, 61, 291]  # nose tip, chin, eyes, mouth corners
MODEL_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),          # nose tip
    (0.0, -330.0, -65.0),     # chin
    (-225.0, 170.0, -135.0),  # left eye left corner
    (225.0, 170.0, -135.0),   # right eye right corner
    (-150.0, -150.0, -125.0),# left mouth corner
    (150.0, -150.0, -125.0), # right mouth corner
], dtype=np.float64)


def _euclidean(p1, p2):
    return math.dist(p1, p2)


def _eye_aspect_ratio(landmarks, idxs, w, h):
    pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in idxs]
    p1, p2, p3, p4, p5, p6 = pts
    vertical = _euclidean(p2, p6) + _euclidean(p3, p5)
    horizontal = 2.0 * _euclidean(p1, p4)
    return vertical / horizontal if horizontal else 0.0


def _mouth_aspect_ratio(landmarks, w, h):
    pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in MOUTH]
    vertical = _euclidean(pts[2], pts[3]) + _euclidean(pts[6], pts[7])
    horizontal = 2.0 * _euclidean(pts[0], pts[1])
    return vertical / horizontal if horizontal else 0.0


def _gaze_ratio(landmarks, w, h):
    """Approximate horizontal gaze deviation using iris vs eye-corner position."""
    l_iris = np.mean([[landmarks[i].x * w, landmarks[i].y * h] for i in LEFT_IRIS], axis=0)
    r_iris = np.mean([[landmarks[i].x * w, landmarks[i].y * h] for i in RIGHT_IRIS], axis=0)

    l_corner_l = np.array([landmarks[362].x * w, landmarks[362].y * h])
    l_corner_r = np.array([landmarks[263].x * w, landmarks[263].y * h])
    r_corner_l = np.array([landmarks[33].x * w, landmarks[33].y * h])
    r_corner_r = np.array([landmarks[133].x * w, landmarks[133].y * h])

    def ratio(iris, corner_l, corner_r):
        span = np.linalg.norm(corner_r - corner_l)
        if span == 0:
            return 0.5
        return np.linalg.norm(iris - corner_l) / span

    return float(np.mean([ratio(l_iris, l_corner_l, l_corner_r),
                           ratio(r_iris, r_corner_l, r_corner_r)]))


def _head_pose(landmarks, w, h):
    image_points = np.array([
        (landmarks[i].x * w, landmarks[i].y * h) for i in HEAD_POSE_LANDMARKS
    ], dtype=np.float64)

    focal_length = w
    center = (w / 2, h / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float64)
    dist_coeffs = np.zeros((4, 1))

    success, rotation_vec, _ = cv2.solvePnP(
        MODEL_POINTS_3D, image_points, camera_matrix, dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not success:
        return 0.0, 0.0, 0.0

    rot_mat, _ = cv2.Rodrigues(rotation_vec)
    proj_matrix = np.hstack((rot_mat, np.zeros((3, 1))))
    euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)[6]
    pitch, yaw, roll = [float(a[0]) for a in euler_angles]
    return pitch, yaw, roll


class DeceptionFeatureExtractor:
    """
    Stateful extractor: keeps a short rolling buffer so it can compute
    blink RATE (not just single-frame eye closure) across a session.
    Instantiate one per active session/client.
    """

    EAR_BLINK_THRESHOLD = 0.21

    def __init__(self, window_seconds=30):
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.window_seconds = window_seconds
        self.blink_timestamps = deque()
        self._eye_closed = False

    def process_frame(self, bgr_frame):
        h, w = bgr_frame.shape[:2]
        rgb = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return {"face_detected": False}

        landmarks = results.multi_face_landmarks[0].landmark

        left_ear = _eye_aspect_ratio(landmarks, LEFT_EYE, w, h)
        right_ear = _eye_aspect_ratio(landmarks, RIGHT_EYE, w, h)
        ear = (left_ear + right_ear) / 2.0
        mar = _mouth_aspect_ratio(landmarks, w, h)
        gaze = _gaze_ratio(landmarks, w, h)
        pitch, yaw, roll = _head_pose(landmarks, w, h)

        now = time.time()
        if ear < self.EAR_BLINK_THRESHOLD and not self._eye_closed:
            self._eye_closed = True
            self.blink_timestamps.append(now)
        elif ear >= self.EAR_BLINK_THRESHOLD:
            self._eye_closed = False

        while self.blink_timestamps and now - self.blink_timestamps[0] > self.window_seconds:
            self.blink_timestamps.popleft()

        elapsed = min(self.window_seconds, now - (self.blink_timestamps[0] if self.blink_timestamps else now))
        blink_rate_per_min = (len(self.blink_timestamps) / max(elapsed, 1e-6)) * 60

        return {
            "face_detected": True,
            "ear": round(ear, 4),
            "mar": round(mar, 4),
            "gaze_ratio": round(gaze, 4),
            "head_pitch": round(pitch, 2),
            "head_yaw": round(yaw, 2),
            "head_roll": round(roll, 2),
            "blink_rate_per_min": round(blink_rate_per_min, 2),
            "timestamp": now,
        }

    def close(self):
        self.face_mesh.close()


def features_to_vector(feature_dict):
    return np.array([[feature_dict.get(k, 0.0) for k in FEATURE_ORDER]])
