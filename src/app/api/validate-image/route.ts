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

    // For try-on, we need a strict check: must be a direct personal photograph,
    // not a poster, banner, flex, flyer, graphic design, or printed material.
    const prompt =
      type === "full_body"
        ? "Is this image a direct personal photograph of a real person taken with a camera or phone (such as a selfie or full-body photo)? Answer 'yes' only if it is a genuine personal photo of a real person. Answer 'no' if it is a poster, banner, flex, flyer, advertisement, graphic design, printed material, illustration, or any image that contains a person but was NOT taken as a direct personal photograph."
        : "Does this image clearly show a person or a human face in a direct photograph? Reply with only 'yes' or 'no'.";

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
