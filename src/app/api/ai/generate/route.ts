import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const key = process.env.XAI_API_KEY || "";
    
    if (!key) {
      console.error("Missing XAI_API_KEY");
      return NextResponse.json({ error: "XAI API key is missing" }, { status: 500 });
    }

    const { prompt, format } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const formatContext = format === 'story' 
      ? "Target Format: INSTAGRAM STORY (9:16). Keep the texts extremely concise, bold, and punchy. It will be viewed for only a few seconds. Do NOT make the description too long."
      : format === 'square'
      ? "Target Format: SQUARE FEED (1:1). Standard social media post."
      : "Target Format: PORTRAIT FEED (4:5). Ensure texts are engaging and readable.";

    const systemPrompt = `
      You are a professional social media marketing expert and Art Director for "SerenaRaga", a comfortable, personal, and private homecare massage service in Indonesia.
      Do NOT use words like "luxury", "premium", "exclusive", or similar overly-expensive branding words.
      ${formatContext}
      
      Your task is to generate compelling Instagram content AND provide an Art Direction context for the background image based on the user's input.
      
      Return the result strictly as a JSON object with these exact fields:
      - isCarousel (boolean, set to true if the user prompt implies a multi-step guide, tips series, carousel format, multiple slides, or step-by-step information. Otherwise false.)
      - theme (MUST BE ONE OF: "split_screen_dark", "classic_glass", "editorial_overlay", "story_minimalist", "solid_poster". If user wants a Poster, Schedule, or Pricelist, ALWAYS choose "solid_poster". If Format is INSTAGRAM STORY and user didn't ask for a poster, choose "story_minimalist". Otherwise, choose based on mood. If isCarousel is true, this should be the theme of slide 1.)
      - label (MUST BE A STRICT CATEGORY TAG, exact options: "PROMO", "TIPS", "INFO", "QUOTE", "TESTIMONI", "LAYANAN", "REMINDER", "LOKER". Max 1 word.)
      - title (Short, catchy, uppercase-ish, max 3-4 words. If isCarousel is true, this should be the title of slide 1.)
      - price (The offer/price, e.g. "DISKON 30%", "Start from 100k", or empty string if not applicable. If isCarousel is true, this should be for slide 1.)
      - description (Standard text/caption, max 2 short sentences. Leave empty if using myth/fact or quote. If isCarousel is true, this should be the description of slide 1.)
      - myth (ONLY IF the user asks for Mitos vs Fakta. The myth text.)
      - fact (ONLY IF the user asks for Mitos vs Fakta. The fact text.)
      - quote (ONLY IF the user asks for a Quote. The quote text.)
      - author (ONLY IF the user asks for a Quote. The author name.)
      - listItems (ONLY IF the user asks for a Pricelist, Schedule, Requirements, or Hiring Info. Must be an array of objects: [{ label: "item name/requirement", value: "price/detail/empty" }].)
      - caption (Write in INDONESIAN language. MUST BE READY TO COPY-PASTE TO INSTAGRAM. Format cleanly with proper paragraphs/line breaks (use \n\n). DO NOT write one massive block of text. Keep it VERY CONCISE, professional, warm, and personal. Include: 1. Short hook. 2. 1-2 short sentences body text. 3. Soft CTA to WhatsApp. 4. VERY STRICT: NO AI-style emojis. Use only 1 or 2 very natural, minimalist emojis (like 🍃 or 🤍) where absolutely necessary. 5. Exact hashtags: #SerenaRaga #PijatPanggilanJogja #HomeCareSpa #PijatKeluarga)
      - visualSubject (The main visual object to be featured in the background photo of slide 1. Describe it simply and neutrally in English. Example: "A folded clean white spa towel")
      - seasonalNuance (The lighting and mood for the image. If it's a normal post, use "warm cream and earth tones, natural daylight". If it's a special occasion, adapt it subtly, e.g., "warm golden lighting, subtle ramadan aesthetic" or "soft winter mood, subtle christmas aesthetic")
      - artStyle (MUST BE "vector" ONLY IF the user explicitly mentions words like "vector", "ilustrasi", "illustration", "flat design". Otherwise MUST BE "photo".)
      - slides (ONLY IF isCarousel is true. An array of objects representing each slide. IMPORTANT: Slide 1 (slides[0]) MUST ALWAYS be a dedicated, high-converting Hook/Cover Slide with a strong curiosity-inducing title and description to hook the reader. Slide 2 and subsequent slides contain the actual content/steps/tips/info. Each slide object in the array must contain:
          - theme (theme for this specific slide: "split_screen_dark", "classic_glass", "editorial_overlay", "story_minimalist", "solid_poster")
          - title (Slide header text: for Slide 1, this is the main hook/attention-grabber. For other slides, this is the step/tip header. Short, catchy, max 4-5 words)
          - description (Slide body text: for Slide 1, a brief sub-hook. For other slides, the details. Max 1-2 short sentences)
          - price (only if applicable, else empty string)
          - myth (only if Mitos vs Fakta)
          - fact (only if Mitos vs Fakta)
          - quote (only if Quote)
          - author (only if Quote)
          - listItems (only if Pricelist/Schedule/Loker)
          - visualSubject (The visual object to be featured in the background photo of this specific slide. Must be different and custom for each slide's topic, described in English. Example: slide 1 visualSubject "A serene private massage room with warm ambient light", slide 2 visualSubject "A bowl of warm herbal massage oil on stone", slide 3 visualSubject "A person receiving a shoulder massage from therapist's hands")
        )
    `;

    // Using fetch directly for xAI
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User Input: "${prompt}"\n\nGenerate the JSON response.` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Grok API Error:", errText);
      throw new Error(`Grok API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from potential markdown markers just in case
    const jsonStr = content.replace(/```json|```/g, "").trim();
    const resultJson = JSON.parse(jsonStr);

    return NextResponse.json(resultJson);
  } catch (error: any) {
    console.error("AI Route Error Details:", error);
    return NextResponse.json({ 
      error: "Failed to generate AI content",
      detail: error.message 
    }, { status: 500 });
  }
}
