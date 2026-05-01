import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { image, type } = await req.json();

    if (!image) {
      return NextResponse.json({ valid: false, message: "No image provided." }, { status: 400 });
    }

    // If no API key, skip validation and allow upload
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ valid: true });
    }

    const stripPrefix = (b64: string) => {
      const match = b64.match(/^data:image\/\w+;base64,(.+)$/);
      return match ? match[1] : b64;
    };

    const imageData = stripPrefix(image);

    const prompt =
      type === "full_body"
        ? "Does this image show a person (full body or at least the upper body visible)? Reply with only 'yes' or 'no'."
        : "Does this image clearly show a person or a human face? Reply with only 'yes' or 'no'.";

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }],
    });

    const answer =
      response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.toLowerCase().trim() ?? "";

    const valid = answer.startsWith("yes");
    return NextResponse.json({ valid });
  } catch {
    // On Gemini error, allow the upload rather than blocking the user
    return NextResponse.json({ valid: true });
  }
}
