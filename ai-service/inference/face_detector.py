"""Face detection using YOLOv8 - REQ-F-01 to REQ-F-04."""

import logging
import numpy as np

logger = logging.getLogger(__name__)


class FaceDetector:
    def __init__(self):
        from ultralytics import YOLO
        # Use standard YOLOv8n and detect persons/faces
        # yolov8n.pt is auto-downloaded on first use
        self.model = YOLO("yolov8n.pt")
        logger.info("YOLOv8n detector loaded")

    def detect(self, image: np.ndarray) -> dict:
        """Detect faces in image using YOLOv8 person detection + face crop heuristic."""
        results = self.model(image, verbose=False, classes=[0])  # class 0 = person

        if len(results) == 0 or len(results[0].boxes) == 0:
            return {"detected": False, "bbox": None, "confidence": 0.0}

        # Get the highest confidence person detection
        boxes = results[0].boxes
        best_idx = boxes.conf.argmax().item()
        bbox = boxes.xyxy[best_idx].cpu().numpy().tolist()
        confidence = boxes.conf[best_idx].item()

        # Estimate face region as top 35% of the person bounding box
        x1, y1, x2, y2 = [int(b) for b in bbox]
        person_height = y2 - y1
        face_y2 = y1 + int(person_height * 0.35)

        # Narrow the face region horizontally (center 60%)
        person_width = x2 - x1
        face_x1 = x1 + int(person_width * 0.2)
        face_x2 = x2 - int(person_width * 0.2)

        face_bbox = [face_x1, y1, face_x2, face_y2]

        return {
            "detected": True,
            "bbox": face_bbox,
            "person_bbox": [x1, y1, x2, y2],
            "confidence": round(confidence, 3),
        }

    def crop_face(self, image: np.ndarray, bbox: list) -> np.ndarray:
        """Crop detected face region from image (REQ-F-03)."""
        x1, y1, x2, y2 = bbox
        h, w = image.shape[:2]
        # Clamp to image bounds
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        return image[y1:y2, x1:x2]
