"""Facial feature analysis using MediaPipe Face Landmarker (tasks API) - REQ-F-05 to REQ-F-08."""

import os
import logging
import urllib.request
import numpy as np
import mediapipe as mp

logger = logging.getLogger(__name__)

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "face_landmarker.task")


class FaceAnalyzer:
    def __init__(self):
        # Download model if not present
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        if not os.path.exists(MODEL_PATH):
            logger.info(f"Downloading face landmarker model...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            logger.info("Face landmarker model downloaded")

        base_options = mp.tasks.BaseOptions(model_asset_path=MODEL_PATH)
        options = mp.tasks.vision.FaceLandmarkerOptions(
            base_options=base_options,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
        )
        self.detector = mp.tasks.vision.FaceLandmarker.create_from_options(options)
        logger.info("MediaPipe Face Landmarker loaded (478 landmarks)")

    def analyze(self, image: np.ndarray) -> dict:
        """Extract facial landmarks and classify face shape."""
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)
        results = self.detector.detect(mp_image)

        if not results.face_landmarks or len(results.face_landmarks) == 0:
            return {"face_shape": "unknown", "landmarks_count": 0}

        landmarks = results.face_landmarks[0]
        h, w, _ = image.shape

        # Convert normalized landmarks to pixel coordinates
        points = np.array([(lm.x * w, lm.y * h) for lm in landmarks])

        face_shape = self._classify_face_shape(points)

        return {
            "face_shape": face_shape,
            "landmarks_count": len(points),
        }

    def _classify_face_shape(self, points: np.ndarray) -> str:
        """Classify face shape using landmark ratios."""
        try:
            # Forehead width: landmarks 70 and 300
            forehead_width = np.linalg.norm(points[70] - points[300])

            # Cheekbone width: landmarks 234 and 454
            cheekbone_width = np.linalg.norm(points[234] - points[454])

            # Jawline width: landmarks 172 and 397
            jaw_width = np.linalg.norm(points[172] - points[397])

            # Face length: landmarks 10 (top) and 152 (chin)
            face_length = np.linalg.norm(points[10] - points[152])

            width_to_length = cheekbone_width / face_length if face_length > 0 else 0
            jaw_to_cheek = jaw_width / cheekbone_width if cheekbone_width > 0 else 0
            forehead_to_jaw = forehead_width / jaw_width if jaw_width > 0 else 0

            if width_to_length > 0.85:
                if jaw_to_cheek > 0.9:
                    return "square"
                return "round"
            elif width_to_length < 0.65:
                return "oblong"
            elif forehead_to_jaw > 1.15:
                return "heart"
            else:
                return "oval"
        except (IndexError, ZeroDivisionError):
            return "oval"
