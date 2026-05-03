import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { analysis, preferences } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const face_shape = analysis?.face_shape || "unknown";
    const skin_tone  = analysis?.skin_tone  || "unknown";
    const body_type  = analysis?.body_type  || "unknown";
    const occasion   = preferences?.occasion || "casual";
    const weather    = preferences?.weather  || "moderate";
    const budget     = preferences?.budget   || "medium";

    const prompt = `You are a professional fashion stylist AI. Generate highly personalized fashion recommendations for this person.

Person Profile:
- Face Shape: ${face_shape}
- Skin Tone: ${skin_tone}
- Body Type: ${body_type}

Style Preferences:
- Occasion: ${occasion}
- Weather: ${weather}
- Budget: ${budget}

Return ONLY a valid JSON object with exactly this structure — no markdown, no explanation:
{
  "color_palette": ["5 specific recommended colors that suit their skin tone and face shape"],
  "colors_to_avoid": ["2 to 3 colors they should avoid"],
  "outfit_styles": ["3 to 4 outfit styles tailored to their body type and occasion"],
  "neckline_suggestions": ["2 to 3 neckline styles that flatter their face shape"],
  "accessory_suggestions": ["2 to 3 accessories that complement their look"],
  "occasion_items": ["2 to 3 specific clothing items perfect for the occasion"],
  "weather_additions": ["1 to 2 items to add for the weather"],
  "weather_removals": ["1 to 2 items to avoid for this weather"],
  "budget_tier": "one of: budget / mid-range / premium"
}`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [prompt],
    });

    const raw = response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text || "{}";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const recommendations = JSON.parse(cleaned);

    return NextResponse.json({ recommendations });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Recommendation generation failed" },
      { status: 500 }
    );
  }
}
