"""Skin tone classification - REQ-F-06, REQ-F-07."""

import logging
import numpy as np
import cv2

logger = logging.getLogger(__name__)

# Monk Skin Tone Scale (10 categories)
MONK_SCALE = [
    {"id": 1, "label": "Very Light", "hex": "#f6ede4"},
    {"id": 2, "label": "Light", "hex": "#f3e7db"},
    {"id": 3, "label": "Light Medium", "hex": "#f7d7c4"},
    {"id": 4, "label": "Medium Light", "hex": "#eeceb3"},
    {"id": 5, "label": "Medium", "hex": "#d4a574"},
    {"id": 6, "label": "Medium Tan", "hex": "#c68642"},
    {"id": 7, "label": "Tan", "hex": "#8d5524"},
    {"id": 8, "label": "Dark Tan", "hex": "#765339"},
    {"id": 9, "label": "Dark", "hex": "#613d30"},
    {"id": 10, "label": "Very Dark", "hex": "#3c2415"},
]


class SkinToneClassifier:
    def __init__(self):
        logger.info("Skin tone classifier loaded (Monk Scale 10-point)")

    def classify(self, image: np.ndarray, bbox: list | None = None) -> dict:
        """Classify skin tone from face region using L*a*b* color space."""
        if bbox is None:
            return {"category": "unknown", "hex_color": "#000000", "monk_id": 0}

        # Extract face region
        x1, y1, x2, y2 = bbox
        face_region = image[y1:y2, x1:x2]

        if face_region.size == 0:
            return {"category": "unknown", "hex_color": "#000000", "monk_id": 0}

        # REQ-F-07: Normalize lighting using L*a*b* color space
        lab_image = cv2.cvtColor(face_region, cv2.COLOR_RGB2LAB)

        # Sample from cheek regions (middle 40% of face, avoiding eyes/mouth)
        h, w = face_region.shape[:2]
        cheek_region = lab_image[int(h * 0.4):int(h * 0.7), int(w * 0.2):int(w * 0.8)]

        if cheek_region.size == 0:
            return {"category": "unknown", "hex_color": "#000000", "monk_id": 0}

        # Get average L* value (lightness channel)
        avg_l = np.mean(cheek_region[:, :, 0])

        # Map L* value to Monk Scale
        monk_entry = self._map_to_monk_scale(avg_l)

        return {
            "category": monk_entry["label"],
            "hex_color": monk_entry["hex"],
            "monk_id": monk_entry["id"],
        }

    def _map_to_monk_scale(self, lightness: float) -> dict:
        """Map L*a*b* lightness value (0-255) to Monk Skin Tone Scale."""
        # L* ranges mapped to 10 categories
        if lightness > 220:
            return MONK_SCALE[0]
        elif lightness > 200:
            return MONK_SCALE[1]
        elif lightness > 185:
            return MONK_SCALE[2]
        elif lightness > 170:
            return MONK_SCALE[3]
        elif lightness > 150:
            return MONK_SCALE[4]
        elif lightness > 130:
            return MONK_SCALE[5]
        elif lightness > 110:
            return MONK_SCALE[6]
        elif lightness > 90:
            return MONK_SCALE[7]
        elif lightness > 70:
            return MONK_SCALE[8]
        else:
            return MONK_SCALE[9]
