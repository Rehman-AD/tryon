"""Body type analysis using MediaPipe Pose Landmarker (tasks API) - REQ-F-09 to REQ-F-11."""

import os
import logging
import urllib.request
import numpy as np
import mediapipe as mp

logger = logging.getLogger(__name__)

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "pose_landmarker.task")

BODY_TYPES = {
    "hourglass": "Balanced shoulders and hips with a defined waist",
    "pear": "Hips wider than shoulders",
    "apple": "Shoulders and midsection wider than hips",
    "rectangle": "Shoulders, waist, and hips similar width",
    "inverted_triangle": "Shoulders notably wider than hips",
}


class BodyTypeAnalyzer:
    def __init__(self):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        if not os.path.exists(MODEL_PATH):
            logger.info("Downloading pose landmarker model...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            logger.info("Pose landmarker model downloaded")

        base_options = mp.tasks.BaseOptions(model_asset_path=MODEL_PATH)
        options = mp.tasks.vision.PoseLandmarkerOptions(
            base_options=base_options,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
        )
        self.detector = mp.tasks.vision.PoseLandmarker.create_from_options(options)
        logger.info("MediaPipe Pose Landmarker loaded (33 body landmarks)")

    def analyze(self, image: np.ndarray) -> dict:
        """Analyze body type from image using pose landmarks."""
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        results = self.detector.detect(mp_image)

        if not results.pose_landmarks or len(results.pose_landmarks) == 0:
            return {"detected": False, "body_type": "unknown", "confidence": 0.0, "measurements": {}}

        landmarks = results.pose_landmarks[0]
        h, w, _ = image.shape

        # Check visibility of key landmarks (shoulders=11,12 and hips=23,24)
        key_indices = [11, 12, 23, 24]
        visibility = min(landmarks[i].visibility for i in key_indices)

        if visibility < 0.3:
            return {"detected": False, "body_type": "unknown", "confidence": float(visibility), "measurements": {}}

        measurements = self._compute_measurements(landmarks, w, h)
        body_type = self._classify_body_type(measurements)

        return {
            "detected": True,
            "body_type": body_type,
            "confidence": round(float(visibility), 3),
            "measurements": measurements,
        }

    def _compute_measurements(self, landmarks, w: int, h: int) -> dict:
        """Compute body measurements from pose landmarks."""
        def point(idx):
            lm = landmarks[idx]
            return np.array([lm.x * w, lm.y * h])

        shoulder_width = np.linalg.norm(point(11) - point(12))
        hip_width = np.linalg.norm(point(23) - point(24))

        mid_left = (point(11) + point(23)) / 2
        mid_right = (point(12) + point(24)) / 2
        waist_width = np.linalg.norm(mid_left - mid_right)

        return {
            "shoulder_width": round(float(shoulder_width), 1),
            "hip_width": round(float(hip_width), 1),
            "waist_width": round(float(waist_width), 1),
            "shoulder_to_hip_ratio": round(float(shoulder_width / hip_width), 3) if hip_width > 0 else 0,
            "waist_to_hip_ratio": round(float(waist_width / hip_width), 3) if hip_width > 0 else 0,
        }

    def _classify_body_type(self, measurements: dict) -> str:
        """Classify body type using shoulder-hip-waist ratios."""
        shr = measurements["shoulder_to_hip_ratio"]
        whr = measurements["waist_to_hip_ratio"]

        if shr > 1.15:
            return "inverted_triangle"
        elif shr < 0.85:
            return "pear"
        elif whr < 0.75:
            return "hourglass"
        elif whr > 0.9:
            if shr > 1.0:
                return "apple"
            return "rectangle"
        else:
            return "rectangle"
