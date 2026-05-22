import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const key = process.env.XAI_API_KEY || "";
    
    if (!key) {
      console.error("Missing XAI_API_KEY");
      return NextResponse.json({ error: "XAI API key is missing" }, { status: 500 });
    }

    const { visualSubject, seasonalNuance, artStyle, format, title, description, quote, myth, fact } = await req.json();

    if (!visualSubject || !seasonalNuance) {
      return NextResponse.json({ error: "visualSubject and seasonalNuance are required" }, { status: 400 });
    }

    let baseStyle = "Photography style, highly aesthetic, minimalist";
    let textConstraint = "NO TEXT, NO TYPOGRAPHY, empty space for copy.";

    if (artStyle === "vector") {
      baseStyle = "Premium minimalist flat vector illustration, highly elegant paper-cut style. Solid warm muted pastel colors, clean distinct geometric shapes. ABSOLUTELY NO 3D gradients, NO drop shadows on objects, NO messy details, NO photorealism. Professional editorial quality, subtle textured paper background, FULL BLEED artwork filling the entire canvas, NO borders, NO torn paper edges";
      textConstraint = "NO TEXT, NO TYPOGRAPHY.";
    }

    const formatContext = "Ensure the image fills the entire square canvas completely. DO NOT add any borders, letterboxing, padding, frames, or background templates. It must be a pure full-bleed photo/illustration from edge to edge.";

    // Combine them with the strict SerenaRaga style guide
    const imagePrompt = `${visualSubject}. ${baseStyle}, ${seasonalNuance}. ${formatContext} Soft lighting, relaxing atmosphere. ${textConstraint}`;

    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        model: "grok-imagine-image-quality",
        response_format: "url"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Grok Image API Error:", errText);
      
      let isModeration = false;
      try {
        const errObj = JSON.parse(errText);
        if (errObj.error && errObj.error.toLowerCase().includes("moderation")) {
          isModeration = true;
        }
      } catch (e) {}

      if (isModeration) {
        console.log("Triggered moderation, trying safe fallback prompt...");
        const fallbackPrompt = "Abstract warm gradient background, highly aesthetic minimalist, pure empty space, no objects, no text, no typography";
        const fbRes = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            prompt: fallbackPrompt,
            model: "grok-imagine-image-quality",
            response_format: "url"
          })
        });

        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const fallbackUrl = fbData.data?.[0]?.url;
          if (fallbackUrl) {
            const imgFetch = await fetch(fallbackUrl);
            if (imgFetch.ok) {
              const arrayBuffer = await imgFetch.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64Str = `data:${imgFetch.headers.get("content-type") || "image/jpeg"};base64,${buffer.toString("base64")}`;
              return NextResponse.json({ url: base64Str, note: "fallback_used" });
            }
          }
        }
      }

      throw new Error(`Grok Image API Error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from Grok");
    }

    // Fetch the image and convert to base64 to avoid Canvas CORS taint issues
    const imgFetch = await fetch(imageUrl);
    if (!imgFetch.ok) throw new Error("Failed to fetch image from Grok URL");
    
    const arrayBuffer = await imgFetch.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Str = `data:${imgFetch.headers.get("content-type") || "image/jpeg"};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ url: base64Str });
  } catch (error: any) {
    console.error("Image Gen Route Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate image",
      detail: error.message 
    }, { status: 500 });
  }
}
