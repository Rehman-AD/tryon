import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createLogger } from "@/lib/logger";

const log = createLogger("api.tryon");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const TRYON_PROMPT = `Regenerate the first image so the person is naturally wearing or carrying the item from the second image. Maintain the exact same person, face, body, background, lighting, and pose. Only add/change the clothing or accessory to match the second image. Make it look like a real, natural photograph.`;

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 10);
  const start = Date.now();

  try {
    const { userImage, productImage } = await req.json();

    if (!userImage || !productImage) {
      return NextResponse.json({ error: "Both userImage and productImage are required" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      log.warn(`[${requestId}] GEMINI_API_KEY not configured`);
      return NextResponse.json({ error: "Virtual try-on is not configured. Set GEMINI_API_KEY in .env.local" }, { status: 500 });
    }

    log.info(`[${requestId}] Try-on request started`);

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Strip data URL prefix to get raw base64
    const stripPrefix = (b64: string) => {
      const match = b64.match(/^data:image\/\w+;base64,(.+)$/);
      return match ? match[1] : b64;
    };

    const userImageData = stripPrefix(userImage);
    const productImageData = stripPrefix(productImage);

    // Image generation models to try (in order)
    const IMAGE_MODELS = [
      "gemini-2.5-flash-image",
      "gemini-3.1-flash-image-preview",
      "gemini-3-pro-image-preview",
    ];

    for (const modelName of IMAGE_MODELS) {
      try {
        log.info(`[${requestId}] Trying model: ${modelName}`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            TRYON_PROMPT,
            {
              inlineData: {
                data: userImageData,
                mimeType: "image/jpeg",
              },
            },
            "This is the person's photo.",
            {
              inlineData: {
                data: productImageData,
                mimeType: "image/jpeg",
              },
            },
            "This is the clothing/accessory item to put on the person.",
          ],
        });

        let generatedImage: string | null = null;
        let description = "";

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
              generatedImage = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            }
            if (part.text) {
              description = part.text;
            }
          }
        }

        if (generatedImage) {
          const elapsed = Date.now() - start;
          log.info(`[${requestId}] Image generated with ${modelName}`, { elapsed: `${elapsed}ms` });
          return NextResponse.json({
            success: true,
            image: generatedImage,
            description: description || "Virtual try-on generated successfully.",
          });
        }

        log.warn(`[${requestId}] ${modelName} returned no image, trying next...`);
      } catch (modelErr) {
        log.warn(`[${requestId}] ${modelName} failed: ${String(modelErr)}`);
        continue;
      }
    }

    // All image models failed — vision analysis fallback
    log.warn(`[${requestId}] All image models failed, using vision fallback`);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          "You are a fashion expert. Analyze these two images. Image 1 is a person, Image 2 is a clothing/accessory item. Describe in vivid detail how this item would look on this person. Be specific about fit, color coordination, and styling tips.",
          { inlineData: { data: userImageData, mimeType: "image/jpeg" } },
          { inlineData: { data: productImageData, mimeType: "image/jpeg" } },
        ],
      });

      const description = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "Analysis complete.";
      const elapsed = Date.now() - start;
      log.info(`[${requestId}] Vision fallback`, { elapsed: `${elapsed}ms` });

      return NextResponse.json({ success: true, image: null, description });
    } catch (visionErr) {
      log.error(`[${requestId}] Vision fallback failed: ${String(visionErr)}`);
    }

    return NextResponse.json({ error: "All try-on methods failed. Please try again." }, { status: 500 });

  } catch (err) {
    const elapsed = Date.now() - start;
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error(`[${requestId}] Try-on failed`, { elapsed: `${elapsed}ms`, error: errorMessage });
    return NextResponse.json({ error: `Virtual try-on failed: ${errorMessage}` }, { status: 500 });
  }
}
