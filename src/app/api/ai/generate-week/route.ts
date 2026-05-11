import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const client = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" 
});

export async function POST(req: Request) {
  try {
    const { prompt, count = 6, format = 'single', matrix = 'campur', angle = 'default' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let formatInstruction = `Your task is to generate exactly ${count} pieces of compelling Instagram content based on the user's overall theme input.`;
    if (format === 'carousel') {
      formatInstruction = `Your task is to generate an Instagram Carousel consisting of exactly ${count} slides. Treat each slide as one object in the JSON array. Slide 1 should be a strong hook. The middle slides should be educational or storytelling. The last slide should be a Call to Action.`;
    }

    let matrixInstruction = '';
    if (matrix === '8020') {
      matrixInstruction = `CONTENT MATRIX RULE: Ensure approximately 80% of the generated content is Educational/Tips/Value, and 20% is Hard Selling/Promo.`;
    } else if (matrix === 'promo') {
      matrixInstruction = `CONTENT MATRIX RULE: Focus entirely on hard-selling, promotions, discounts, and clear calls to action.`;
    }

    let angleInstruction = '';
    if (angle === 'fomo') {
      angleInstruction = `PSYCHOLOGICAL ANGLE: Use FOMO (Fear Of Missing Out). Create a sense of urgency (e.g., limited slots, body exhaustion if they don't rest now).`;
    } else if (angle === 'relatable') {
      angleInstruction = `PSYCHOLOGICAL ANGLE: Be highly relatable and empathetic. Focus on daily struggles (e.g., tired after work, back pain from sitting) and offer comfort.`;
    } else if (angle === 'curiosity') {
      angleInstruction = `PSYCHOLOGICAL ANGLE: Use Curiosity. Start with surprising questions or secrets (e.g., "Tahukah kamu rahasia pijat 60 menit...").`;
    }

    const seed = Math.floor(Math.random() * 100000);

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        temperature: 1.1, // High creativity, less repetitive
      },
      contents: [{
        role: "user",
        parts: [{
          text: `
            RANDOM SEED: ${seed} (CRITICAL: You MUST generate completely unique, non-repetitive ideas that you have never generated before based on this seed).

            You are a professional social media marketing expert for "SerenaRaga", a comfortable, personal, and private homecare massage service in Indonesia. Do NOT use words like "luxury", "premium", "exclusive", or similar overly-expensive branding words.
            
            ${formatInstruction}
            ${matrixInstruction}
            ${angleInstruction}
            
            Available visual templates (themes) you must choose from for each post:
            'aura', 'zen', 'editorial', 'quote', 'promo', 'mythfact', 'watestimonial', 'gradient', 'minimal', 'boldoverlay', 'softpastel', 'benefits', 'luxurygold', 'carousel', 'announcement', 'nightvibe', 'earthy', 'portrait', 'pricelist', 'dualtone', 'collage', 'magazine', 'polaroid', 'split', 'glass', 'focus', 'elegant', 'vibrant', 'classic', 'modern'
            
            Return the result strictly as a JSON ARRAY of ${count} objects. Each object represents one post/slide and must have these exact fields:
            - dayName (e.g., "Konten 1", "Konten 2", etc. or "Slide 1", "Slide 2" if carousel)
            - theme (Choose ONE of the exact available visual templates listed above that best fits the post's content. If it's a real WhatsApp testimonial, STRICTLY use 'watestimonial')
            - label (MUST BE A STRICT CATEGORY TAG, exact options: "PROMO", "TIPS", "INFO", "QUOTE", "TESTIMONI", "LAYANAN", "REMINDER". Max 1 word.)
            - title (Short, catchy, uppercase-ish, max 3-4 words. VERY IMPORTANT: Wrap the most emotional or striking 1-2 words in **asterisks** like **this** to trigger bold typography highlights in our renderer.)
            - price (The offer/price, or a short sub-headline if not a promo, e.g. "DISKON 30%", "Start from 100k", or "TIPS SEHAT")
            - description (A warm, emotional quote or fact about wellness, max 2 short sentences. If theme is 'watestimonial', leave this completely empty as we will use a real screenshot.)
            - quote (Only if theme is 'quote', otherwise empty string. If 'watestimonial', LEAVE EMPTY.)
            - author (Only if theme is 'quote', otherwise empty string. If 'watestimonial', LEAVE EMPTY.)
            - myth (Only if theme is 'mythfact', otherwise empty string)
            - fact (Only if theme is 'mythfact', otherwise empty string)
            - caption (CRITICAL RULE: Write in INDONESIAN language using a casual, human UGC (User Generated Content) storytelling style. DO NOT sound like a corporate robot. DO NOT always start with a question like "Apakah kamu lelah?". Use natural phrasing, occasionally say "Aku" or "Kita" or "Kak", be highly relatable. Keep it VERY CONCISE, format with proper line breaks (\\n\\n). Max 1-2 simple emojis (no ✨🌟). MUST end with exact hashtags: #SerenaRaga #PijatPanggilanJogja #HomeCareSpa #PijatKeluarga)
            
            User's Overall Theme/Input: "${prompt}"
            
            Remember: Output MUST be a valid JSON array of exactly ${count} objects.
          `
        }]
      }]
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON array from potential markdown markers
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);

    if (!Array.isArray(data) || data.length !== count) {
      throw new Error(`AI did not return exactly ${count} pieces of content.`);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Weekly Route Error Detil:", {
      message: error.message,
      status: error.status,
      details: error.details
    });
    return NextResponse.json({ 
      error: "Failed to generate weekly AI content",
      detail: error.message 
    }, { status: error.status || 500 });
  }
}
