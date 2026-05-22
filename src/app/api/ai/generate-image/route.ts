import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Force a consistent, comfortable, private home spa aesthetic without people or text
    const enhancedPrompt = `STILL LIFE, EMPTY ROOM, NO PEOPLE, NO HUMANS, NO MODELS, NO BODY PARTS. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO FONTS. A high-quality, professional photography background image for a home massage and wellness social media post. Visual style: minimalist, calming, comfortable, warm earthy tones, clean aesthetic, interior design, spa items. Scene: ${prompt}. Cinematic soft natural lighting.`;

    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const seed = Math.floor(Math.random() * 100000000);
    
    // Use Pollinations AI (Free, no API key needed, high quality Stable Diffusion)
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1350&nologo=true&seed=${seed}`;

    // Fetch the image on the server to convert to base64, preventing any CORS issues on the canvas
    const imageRes = await fetch(url);
    if (!imageRes.ok) {
        throw new Error("Failed to fetch from Image API");
    }
    
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

    return NextResponse.json({ imageUrl: `data:${mimeType};base64,${base64Image}` });
  } catch (error: any) {
    console.error("Image Generation API Error:", error.message);
    return NextResponse.json({ 
      error: "Failed to generate AI image",
      detail: error.message 
    }, { status: 500 });
  }
}
