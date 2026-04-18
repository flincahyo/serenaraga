import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Using the new 2026 Unified SDK
const client = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" 
});

export async function POST(req: Request) {
  try {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    console.log("Using New SDK with API Key (prefix):", key.substring(0, 5) + "...");
    
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // We switch to gemini-2.5-flash which is the 2026 standard for free tier
    // gemini-2.0-flash seems to have 'limit: 0' in your project quota.
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `
            You are a professional social media marketing expert for "SerenaRaga", a luxury home spa and massage service in Indonesia.
            
            Your task is to generate compelling Instagram content based on the user's input.
            Return the result strictly as a JSON object with these fields:
            - title (Short, catchy, uppercase-ish, max 3-4 words)
            - price (The offer/price, e.g. "DISKON 30%", "Start from 100k", etc.)
            - description (A warm, emotional quote about wellness, max 2 short sentences)
            - unsplashKeywords (3-4 English keywords for a spa image, comma separated)
            
            User Input: "${prompt}"
          `
        }]
      }]
    });

    // New @google/genai SDK: text lives in candidates[0].content.parts[0].text
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON from potential markdown markers
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Route Error Detil:", {
      message: error.message,
      status: error.status,
      details: error.details
    });
    return NextResponse.json({ 
      error: "Failed to generate AI content",
      detail: error.message 
    }, { status: error.status || 500 });
  }
}
