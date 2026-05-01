const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

async function checkAIService(): Promise<boolean> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function analyzeFace(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${AI_SERVICE_URL}/api/analyze/face`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Face analysis failed" }));
    throw new Error(error.detail || "Face analysis failed");
  }

  return res.json();
}

export async function analyzeBody(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${AI_SERVICE_URL}/api/analyze/body`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Body analysis failed" }));
    throw new Error(error.detail || "Body analysis failed");
  }

  return res.json();
}

export async function getRecommendations(
  file: File,
  occasion: string = "casual",
  weather: string = "moderate",
  budget: string = "medium"
) {
  // Check if AI service is running first
  const isOnline = await checkAIService();
  if (!isOnline) {
    throw new Error("AI Service is offline. Start the Python AI server: python ai-service/api.py");
  }

  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams({ occasion, weather, budget });

  const res = await fetch(`${AI_SERVICE_URL}/api/recommend?${params}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Recommendation failed" }));
    throw new Error(error.detail || "Recommendation failed");
  }

  return res.json();
}
