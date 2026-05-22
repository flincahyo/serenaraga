import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const key = process.env.XAI_API_KEY || "";
    
    if (!key) {
      console.error("Missing XAI_API_KEY");
      return NextResponse.json({ error: "XAI API key is missing" }, { status: 500 });
    }

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

    const TEMPLATE_POOL: { id: string; category: string; bestFor: string }[] = [
      // Dark & Sinematik
      { id: 'aura',          category: 'Dark & Sinematik', bestFor: 'TIPS, INFO, LAYANAN' },
      { id: 'gradient',      category: 'Dark & Sinematik', bestFor: 'PROMO, LAYANAN' },
      { id: 'boldoverlay',   category: 'Dark & Sinematik', bestFor: 'QUOTE, REMINDER, TIPS' },
      { id: 'nightvibe',     category: 'Dark & Sinematik', bestFor: 'INFO, REMINDER' },
      { id: 'portrait',      category: 'Dark & Sinematik', bestFor: 'TESTIMONI, LAYANAN' },
      { id: 'dualtone',      category: 'Dark & Sinematik', bestFor: 'PROMO, LAYANAN' },
      { id: 'classic',       category: 'Dark & Sinematik', bestFor: 'QUOTE, TESTIMONI' },
      // Light & Natural
      { id: 'zen',           category: 'Light & Natural',  bestFor: 'TIPS, INFO, LAYANAN' },
      { id: 'minimal',       category: 'Light & Natural',  bestFor: 'QUOTE, TIPS' },
      { id: 'softpastel',    category: 'Light & Natural',  bestFor: 'TESTIMONI, TIPS, INFO' },
      { id: 'earthy',        category: 'Light & Natural',  bestFor: 'LAYANAN, INFO' },
      { id: 'elegant',       category: 'Light & Natural',  bestFor: 'QUOTE, TESTIMONI' },
      { id: 'vibrant',       category: 'Light & Natural',  bestFor: 'PROMO, LAYANAN' },
      // Editorial
      { id: 'editorial',     category: 'Editorial',        bestFor: 'INFO, LAYANAN, PROMO' },
      { id: 'magazine',      category: 'Editorial',        bestFor: 'INFO, LAYANAN' },
      { id: 'collage',       category: 'Editorial',        bestFor: 'LAYANAN, INFO' },
      { id: 'polaroid',      category: 'Editorial',        bestFor: 'TESTIMONI, QUOTE' },
      { id: 'split',         category: 'Editorial',        bestFor: 'PROMO, LAYANAN' },
      { id: 'modern',        category: 'Editorial',        bestFor: 'INFO, TIPS' },
      // Struktural & Info
      { id: 'benefits',      category: 'Struktural',       bestFor: 'TIPS, INFO' },
      { id: 'pricelist',     category: 'Struktural',       bestFor: 'PROMO, LAYANAN' },
      { id: 'mythfact',      category: 'Struktural',       bestFor: 'INFO, TIPS' },
      { id: 'announcement',  category: 'Struktural',       bestFor: 'INFO, REMINDER, PROMO' },
      { id: 'carousel',      category: 'Struktural',       bestFor: 'TIPS, INFO' },
      // Social Proof
      { id: 'testimonial',   category: 'Social Proof',     bestFor: 'TESTIMONI' },
      { id: 'watestimonial', category: 'Social Proof',     bestFor: 'TESTIMONI' },
      { id: 'quote',         category: 'Social Proof',     bestFor: 'QUOTE, REMINDER' },
      // Special FX
      { id: 'glass',         category: 'Special FX',       bestFor: 'QUOTE, LAYANAN' },
      { id: 'frostpanel',    category: 'Special FX',       bestFor: 'LAYANAN, PROMO, INFO' },
      { id: 'glassduo',      category: 'Special FX',       bestFor: 'QUOTE, LAYANAN, TIPS' },
      { id: 'nightglass',    category: 'Special FX',       bestFor: 'QUOTE, LAYANAN, REMINDER' },
      { id: 'glasscolumn',   category: 'Special FX',       bestFor: 'INFO, LAYANAN, TIPS' },
      { id: 'glasshalo',     category: 'Special FX',       bestFor: 'QUOTE, TIPS, LAYANAN' },
      { id: 'glassbar',      category: 'Special FX',       bestFor: 'LAYANAN, PROMO, INFO' },
      { id: 'glasswarm',     category: 'Special FX',       bestFor: 'QUOTE, LAYANAN, PROMO' },
      { id: 'glassearth',    category: 'Special FX',       bestFor: 'INFO, LAYANAN, TIPS' },
      { id: 'focus',         category: 'Special FX',       bestFor: 'TIPS, INFO' },
      { id: 'luxurygold',    category: 'Special FX',       bestFor: 'PROMO, LAYANAN' },
      { id: 'promo',         category: 'Special FX',       bestFor: 'PROMO, REMINDER' },
      // Minimalist Wellness
      { id: 'editorial_bone',    category: 'Minimalist Wellness',  bestFor: 'PROMO, INFO, LAYANAN' },
      { id: 'pastel_wellness',   category: 'Minimalist Wellness',  bestFor: 'TIPS, LAYANAN' },
      { id: 'flat_bento',        category: 'Minimalist Wellness',  bestFor: 'INFO, PROMO' },
      { id: 'charcoal_contrast', category: 'Minimalist Wellness',  bestFor: 'QUOTE, PROMO' },
      { id: 'serene_split',      category: 'Minimalist Wellness',  bestFor: 'LAYANAN, TESTIMONI' },
      { id: 'utilitarian_list',  category: 'Minimalist Wellness',  bestFor: 'TIPS, LAYANAN' },
      { id: 'quiet_quote',       category: 'Minimalist Wellness',  bestFor: 'QUOTE, TESTIMONI' },
      { id: 'muted_monolith',    category: 'Minimalist Wellness',  bestFor: 'INFO, TIPS' },
      { id: 'technical_spa',     category: 'Minimalist Wellness',  bestFor: 'INFO, PROMO' },
      { id: 'layered_paper',     category: 'Minimalist Wellness',  bestFor: 'PROMO, LAYANAN' },
    ];

    function fisherYatesShuffle<T>(arr: T[]): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const categories = [...new Set(TEMPLATE_POOL.map(t => t.category))];
    let distribution: typeof TEMPLATE_POOL = [];

    for (const cat of fisherYatesShuffle(categories)) {
      const catTemplates = fisherYatesShuffle(TEMPLATE_POOL.filter(t => t.category === cat));
      if (catTemplates.length > 0) distribution.push(catTemplates[0]);
      if (distribution.length >= count) break;
    }

    if (distribution.length < count) {
      const usedIds = new Set(distribution.map(t => t.id));
      const remaining = fisherYatesShuffle(TEMPLATE_POOL.filter(t => !usedIds.has(t.id)));
      distribution = [...distribution, ...remaining.slice(0, count - distribution.length)];
    }

    distribution = fisherYatesShuffle(distribution.slice(0, count));

    const forcedAssignment = distribution
      .map((t, i) => `Post ${i + 1}: theme="${t.id}" | Category: ${t.category} | Best content type: ${t.bestFor}`)
      .join('\n');

    const seed = Math.floor(Math.random() * 100000);

    const systemPrompt = `
      RANDOM SEED: ${seed} (generate completely unique, non-repetitive ideas based on this).

      You are a professional social media marketing expert and Art Director for "SerenaRaga", a comfortable, personal, and private homecare massage service in Indonesia. 
      Do NOT use words like "luxury", "premium", "exclusive".

      ${formatInstruction}
      ${matrixInstruction}
      ${angleInstruction}

      ════════════════════════════════════════════════════════
      MANDATORY TEMPLATE ASSIGNMENT — DO NOT CHANGE THESE:
      ════════════════════════════════════════════════════════
      ${forcedAssignment}

      Return STRICTLY as a JSON ARRAY of exactly ${count} objects with these fields:
      - dayName ("Konten 1", "Konten 2" etc. or "Slide 1", "Slide 2" if carousel)
      - theme (MUST match the pre-assigned theme above exactly)
      - label ("PROMO", "TIPS", "INFO", "QUOTE", "TESTIMONI", "LAYANAN", or "REMINDER")
      - title (max 3-4 words, wrap key words in **asterisks** for bold highlight)
      - price (offer/price or short sub-headline)
      - description (warm wellness quote or fact, max 2 sentences. Empty if watestimonial.)
      - quote (only if theme='quiet_quote' or label='QUOTE', else empty string)
      - author (only if there is a quote, else empty string)
      - myth (empty string)
      - fact (empty string)
      - caption (INDONESIAN, casual UGC style, "Aku"/"Kita"/"Kak", VERY STRICT: NO AI-style emojis. Use max 1-2 very natural emojis like 🍃 or 🤍 if needed, make it not look like AI generated. \\n\\n line breaks, end with: #SerenaRaga #PijatPanggilanJogja #HomeCareSpa #PijatKeluarga)
      - visualSubject (The main visual object to be featured in the background photo. Describe it simply and neutrally in English. Example: "A folded clean white spa towel", or if the user prompt mentions Ramadan: "A minimalist wooden lantern")
      - seasonalNuance (The lighting and mood for the image. E.g., "warm cream and earth tones, natural daylight". If user prompt is about a special occasion, adapt it subtly, e.g., "warm golden lighting, subtle ramadan aesthetic" or "soft winter mood")
    `;

    // Using Grok API
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
          { role: "user", content: `User Input: "${prompt}"\n\nGenerate the JSON array.` }
        ],
        temperature: 0.8, // Slightly higher for bulk creativity
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Grok Bulk API Error:", errText);
      throw new Error(`Grok Bulk API Error: ${response.status}`);
    }

    const dataRaw = await response.json();
    const text = dataRaw.choices[0].message.content;

    let jsonStr = text;
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    } else {
      const matchObjectContainingArray = text.match(/\{[\s\S]*"([^"]+)":\s*\[[\s\S]*\][\s\S]*\}/);
      if (matchObjectContainingArray) {
        // Grok might wrap it in {"data": [...]} due to response_format=json_object
        const obj = JSON.parse(text);
        for (const k in obj) {
          if (Array.isArray(obj[k])) {
            jsonStr = JSON.stringify(obj[k]);
            break;
          }
        }
      }
    }

    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
      if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
        // Fallback check if it's an object with an array field inside
        for (const k in data as Record<string, unknown>) {
           if (Array.isArray((data as Record<string, unknown>)[k])) {
              data = (data as Record<string, unknown>)[k];
              break;
           }
        }
      }
    } catch {
      const start = text.indexOf('[');
      const end   = text.lastIndexOf(']');
      if (start !== -1 && end > start) {
        data = JSON.parse(text.slice(start, end + 1));
      } else {
        throw new Error(`AI response was not valid JSON. Raw preview: ${text.slice(0, 300)}`);
      }
    }

    if (!Array.isArray(data) || data.length < 1) {
      throw new Error(`AI returned an empty or non-array response. Expected ~${count} objects.`);
    }

    const trimmed = data.slice(0, count);

    return NextResponse.json(trimmed);
  } catch (error: any) {
    console.error("[generate-bulk] Error:", error);
    return NextResponse.json({
      error: "Gagal generate konten AI. Coba lagi beberapa saat.",
      detail: error.message ?? String(error),
    }, { status: 500 });
  }
}
