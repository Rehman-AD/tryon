"""Claude Vision API analyzer - optional replacement for local models when ANTHROPIC_API_KEY is set."""

import os
import io
import base64
import json
import logging
import httpx

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

FACE_ANALYSIS_PROMPT = """Analyze this person's photo and return ONLY a JSON object with these exact fields:
{
  "face_detected": true/false,
  "face_shape": "oval" | "round" | "square" | "heart" | "oblong",
  "skin_tone": "very_light" | "light" | "light_medium" | "medium" | "medium_tan" | "tan" | "dark_tan" | "dark" | "very_dark" | "deep",
  "skin_tone_hex": "#hexcolor" (approximate skin color as hex),
  "confidence": 0.0-1.0
}

If no face is visible, set face_detected to false and use "unknown" for other fields.
Return ONLY the JSON object, no explanation."""

BODY_ANALYSIS_PROMPT = """Analyze this person's body proportions and return ONLY a JSON object with these exact fields:
{
  "detected": true/false,
  "body_type": "hourglass" | "pear" | "apple" | "rectangle" | "inverted_triangle",
  "confidence": 0.0-1.0
}

Body type definitions:
- hourglass: Balanced shoulders and hips with defined waist
- pear: Hips wider than shoulders
- apple: Shoulders and midsection wider than hips
- rectangle: Shoulders, waist, and hips similar width
- inverted_triangle: Shoulders notably wider than hips

If no body is visible, set detected to false. Return ONLY the JSON object, no explanation."""


def is_claude_available() -> bool:
    """Check if Claude Vision API is configured."""
    return bool(ANTHROPIC_API_KEY and ANTHROPIC_API_KEY.startswith("sk-ant-"))


def _image_to_base64(image_array) -> str:
    """Convert numpy array to base64 JPEG string."""
    from PIL import Image
    img = Image.fromarray(image_array)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _call_claude_vision(image_array, prompt: str) -> dict:
    """Call Claude API with an image and return parsed JSON response."""
    image_b64 = _image_to_base64(image_array)

    response = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 300,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt,
                        },
                    ],
                }
            ],
        },
        timeout=30.0,
    )

    if response.status_code != 200:
        raise RuntimeError(f"Claude API error {response.status_code}: {response.text}")

    data = response.json()
    text = data["content"][0]["text"].strip()

    # Extract JSON from response (handle potential markdown code blocks)
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    return json.loads(text)


def analyze_face_claude(image_array) -> dict:
    """Analyze face using Claude Vision API."""
    logger.info("Using Claude Vision for face analysis")
    result = _call_claude_vision(image_array, FACE_ANALYSIS_PROMPT)

    return {
        "face_detected": result.get("face_detected", False),
        "face_bbox": [0, 0, image_array.shape[1], image_array.shape[0]],  # full image as bbox
        "confidence": result.get("confidence", 0.0),
        "face_shape": result.get("face_shape", "unknown"),
        "landmarks_count": 0,
        "skin_tone": result.get("skin_tone", "unknown"),
        "skin_tone_hex": result.get("skin_tone_hex", "#000000"),
    }


def analyze_body_claude(image_array) -> dict:
    """Analyze body type using Claude Vision API."""
    logger.info("Using Claude Vision for body analysis")
    result = _call_claude_vision(image_array, BODY_ANALYSIS_PROMPT)

    return {
        "detected": result.get("detected", False),
        "body_type": result.get("body_type", "unknown"),
        "confidence": result.get("confidence", 0.0),
        "measurements": {},
    }
