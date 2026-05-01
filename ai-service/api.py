"""GlamVerse AI Service - FastAPI server for AI/ML inference."""

import io
import os
import time
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

from logger import setup_logger
from inference.claude_analyzer import is_claude_available, analyze_face_claude, analyze_body_claude

logger = setup_logger("glamverse.api")
model_logger = setup_logger("glamverse.models")
request_logger = setup_logger("glamverse.requests")

# Check if Claude Vision is available
USE_CLAUDE_VISION = is_claude_available()

# Global model instances
models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI models on startup, cleanup on shutdown."""
    start = time.time()
    model_logger.info("=" * 60)
    model_logger.info("Starting GlamVerse AI Service...")
    model_logger.info("=" * 60)

    if USE_CLAUDE_VISION:
        model_logger.info("ANTHROPIC_API_KEY detected → Claude Vision enabled for image analysis")
        model_logger.info("Local models will be loaded as fallback")
    else:
        model_logger.info("No ANTHROPIC_API_KEY → using local models only")

    try:
        model_logger.info("Loading YOLOv8 face detector...")
        from inference.face_detector import FaceDetector
        models["face_detector"] = FaceDetector()
        model_logger.info("YOLOv8 face detector loaded OK")
    except Exception as e:
        model_logger.error(f"Failed to load face detector: {e}")

    try:
        model_logger.info("Loading MediaPipe Face Mesh...")
        from inference.face_analyzer import FaceAnalyzer
        models["face_analyzer"] = FaceAnalyzer()
        model_logger.info("MediaPipe Face Mesh loaded OK")
    except Exception as e:
        model_logger.error(f"Failed to load face analyzer: {e}")

    try:
        model_logger.info("Loading skin tone classifier...")
        from inference.skin_tone import SkinToneClassifier
        models["skin_tone"] = SkinToneClassifier()
        model_logger.info("Skin tone classifier loaded OK")
    except Exception as e:
        model_logger.error(f"Failed to load skin tone classifier: {e}")

    try:
        model_logger.info("Loading MediaPipe Pose (body analyzer)...")
        from inference.body_analyzer import BodyTypeAnalyzer
        models["body_analyzer"] = BodyTypeAnalyzer()
        model_logger.info("MediaPipe Pose loaded OK")
    except Exception as e:
        model_logger.error(f"Failed to load body analyzer: {e}")

    try:
        model_logger.info("Loading recommendation engine...")
        from inference.recommendation_engine import RecommendationEngine
        models["recommender"] = RecommendationEngine()
        model_logger.info("Recommendation engine loaded OK")
    except Exception as e:
        model_logger.error(f"Failed to load recommendation engine: {e}")

    elapsed = time.time() - start
    model_logger.info(f"All models loaded in {elapsed:.2f}s ({len(models)}/5 successful)")
    model_logger.info("=" * 60)
    model_logger.info(f"Server ready at http://0.0.0.0:8000")
    model_logger.info("=" * 60)

    yield

    models.clear()
    logger.info("Server shutting down. Models unloaded.")


app = FastAPI(
    title="GlamVerse AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request with timing."""
    request_id = str(uuid.uuid4())[:8]
    start = time.time()

    request_logger.info(f"[{request_id}] {request.method} {request.url.path}")

    try:
        response = await call_next(request)
        elapsed = (time.time() - start) * 1000
        request_logger.info(
            f"[{request_id}] {request.method} {request.url.path} → {response.status_code} ({elapsed:.0f}ms)"
        )
        return response
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        request_logger.error(
            f"[{request_id}] {request.method} {request.url.path} → ERROR ({elapsed:.0f}ms): {e}"
        )
        raise


async def read_image(file: UploadFile) -> np.ndarray:
    """Read uploaded file into numpy array."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    arr = np.array(image)
    logger.debug(f"Image loaded: {arr.shape}, size={len(contents)} bytes")
    return arr


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "models_loaded": len(models),
        "available_models": list(models.keys()),
        "claude_vision": USE_CLAUDE_VISION,
    }


@app.post("/api/analyze/face")
async def analyze_face(file: UploadFile = File(...)):
    """Detect face, analyze features, and classify skin tone."""
    try:
        image = await read_image(file)
        logger.info(f"Face analysis started - image shape: {image.shape}")

        # Use Claude Vision if available
        if USE_CLAUDE_VISION:
            try:
                t0 = time.time()
                result = analyze_face_claude(image)
                elapsed = (time.time() - t0) * 1000
                logger.info(f"Claude Vision face analysis: shape={result['face_shape']}, skin={result['skin_tone']}, time={elapsed:.0f}ms")

                if not result["face_detected"]:
                    raise HTTPException(status_code=400, detail="No face detected in image. Please upload a clear photo with a visible face.")

                return result
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"Claude Vision failed, falling back to local models: {e}")

        # Local model pipeline
        # Step 1: Detect face (YOLO)
        t0 = time.time()
        face_result = models["face_detector"].detect(image)
        t_detect = (time.time() - t0) * 1000
        logger.info(f"Face detection: detected={face_result['detected']}, confidence={face_result.get('confidence', 0):.3f}, time={t_detect:.0f}ms")

        if not face_result["detected"]:
            logger.warning("No face detected in uploaded image")
            raise HTTPException(status_code=400, detail="No face detected in image. Please upload a clear photo with a visible face.")

        # Step 2: Analyze facial features (MediaPipe Face Mesh)
        t0 = time.time()
        face_analysis = models["face_analyzer"].analyze(image)
        t_analyze = (time.time() - t0) * 1000
        logger.info(f"Face shape analysis: shape={face_analysis['face_shape']}, landmarks={face_analysis['landmarks_count']}, time={t_analyze:.0f}ms")

        # Step 3: Classify skin tone
        t0 = time.time()
        skin_tone = models["skin_tone"].classify(image, face_result["bbox"])
        t_skin = (time.time() - t0) * 1000
        logger.info(f"Skin tone: category={skin_tone['category']}, hex={skin_tone['hex_color']}, time={t_skin:.0f}ms")

        total = t_detect + t_analyze + t_skin
        logger.info(f"Face analysis complete - total time: {total:.0f}ms")

        return {
            "face_detected": True,
            "face_bbox": face_result["bbox"],
            "confidence": face_result["confidence"],
            "face_shape": face_analysis["face_shape"],
            "landmarks_count": face_analysis["landmarks_count"],
            "skin_tone": skin_tone["category"],
            "skin_tone_hex": skin_tone["hex_color"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Face analysis failed. Please try another image.")


@app.post("/api/analyze/body")
async def analyze_body(file: UploadFile = File(...)):
    """Analyze body type from uploaded image."""
    try:
        image = await read_image(file)
        logger.info(f"Body analysis started - image shape: {image.shape}")

        # Use Claude Vision if available
        if USE_CLAUDE_VISION:
            try:
                t0 = time.time()
                result = analyze_body_claude(image)
                elapsed = (time.time() - t0) * 1000
                logger.info(f"Claude Vision body analysis: type={result['body_type']}, confidence={result['confidence']}, time={elapsed:.0f}ms")

                if not result["detected"]:
                    raise HTTPException(status_code=400, detail="Could not detect body pose. Please upload a full-body photo.")

                return {
                    "body_type": result["body_type"],
                    "confidence": result["confidence"],
                    "measurements": result.get("measurements", {}),
                }
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"Claude Vision failed, falling back to local models: {e}")

        # Local model pipeline
        t0 = time.time()
        result = models["body_analyzer"].analyze(image)
        elapsed = (time.time() - t0) * 1000

        if not result["detected"]:
            logger.warning(f"Body pose not detected (confidence={result['confidence']:.3f})")
            raise HTTPException(status_code=400, detail="Could not detect body pose. Please upload a full-body photo.")

        logger.info(f"Body analysis: type={result['body_type']}, confidence={result['confidence']:.3f}, time={elapsed:.0f}ms")

        return {
            "body_type": result["body_type"],
            "confidence": result["confidence"],
            "measurements": result["measurements"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Body analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Body analysis failed. Please try another image.")


@app.post("/api/recommend")
async def recommend(
    file: UploadFile = File(...),
    occasion: str = "casual",
    weather: str = "moderate",
    budget: str = "medium",
):
    """Get personalized outfit recommendations."""
    try:
        image = await read_image(file)
        logger.info(f"Recommendation request - occasion={occasion}, weather={weather}, budget={budget}, image={image.shape}")
        total_start = time.time()

        # Run analysis pipeline (Claude Vision or local models)
        face_shape = "unknown"
        skin_tone_cat = "unknown"
        body_type = "unknown"

        if USE_CLAUDE_VISION:
            try:
                t0 = time.time()
                face_result = analyze_face_claude(image)
                logger.info(f"  Step 1/2 Claude face: {(time.time()-t0)*1000:.0f}ms - shape={face_result.get('face_shape')}, skin={face_result.get('skin_tone')}")
                face_shape = face_result.get("face_shape", "unknown")
                skin_tone_cat = face_result.get("skin_tone", "unknown")

                t0 = time.time()
                body_result = analyze_body_claude(image)
                logger.info(f"  Step 2/2 Claude body: {(time.time()-t0)*1000:.0f}ms - type={body_result.get('body_type')}")
                body_type = body_result.get("body_type", "unknown")
            except Exception as e:
                logger.warning(f"Claude Vision failed in recommend, falling back to local: {e}")
                USE_CLAUDE_VISION_FALLBACK = True
            else:
                USE_CLAUDE_VISION_FALLBACK = False
        else:
            USE_CLAUDE_VISION_FALLBACK = True

        if not USE_CLAUDE_VISION or USE_CLAUDE_VISION_FALLBACK:
            t0 = time.time()
            face_result = models["face_detector"].detect(image)
            logger.info(f"  Step 1/4 Face detection: {(time.time()-t0)*1000:.0f}ms - detected={face_result['detected']}")

            face_analysis = {}
            skin_tone = {}
            if face_result["detected"]:
                t0 = time.time()
                face_analysis = models["face_analyzer"].analyze(image)
                logger.info(f"  Step 2/4 Face analysis: {(time.time()-t0)*1000:.0f}ms - shape={face_analysis.get('face_shape')}")

                t0 = time.time()
                skin_tone = models["skin_tone"].classify(image, face_result.get("bbox"))
                logger.info(f"  Step 3/4 Skin tone: {(time.time()-t0)*1000:.0f}ms - {skin_tone.get('category')}")
            else:
                logger.warning("  Steps 2-3 skipped (no face detected)")

            t0 = time.time()
            body_result_local = models["body_analyzer"].analyze(image)
            logger.info(f"  Step 4/4 Body analysis: {(time.time()-t0)*1000:.0f}ms - type={body_result_local.get('body_type')}")

            face_shape = face_analysis.get("face_shape", "unknown")
            skin_tone_cat = skin_tone.get("category", "unknown")
            body_type = body_result_local.get("body_type", "unknown")

        # Generate recommendations
        recommendations = models["recommender"].recommend(
            face_shape=face_shape,
            skin_tone=skin_tone_cat,
            body_type=body_type,
            occasion=occasion,
            weather=weather,
            budget=budget,
        )

        total_elapsed = (time.time() - total_start) * 1000
        logger.info(f"Recommendation complete - total pipeline: {total_elapsed:.0f}ms")

        return {
            "analysis": {
                "face_shape": face_shape,
                "skin_tone": skin_tone_cat,
                "body_type": body_type,
            },
            "recommendations": recommendations,
        }
    except Exception as e:
        logger.error(f"Recommendation pipeline failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Recommendation failed. Please try again.")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting uvicorn server...")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
