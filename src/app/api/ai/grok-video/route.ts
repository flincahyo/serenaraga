import { NextResponse } from "next/server";

// POST: Start Video Generation
export async function POST(req: Request) {
  try {
    const key = process.env.XAI_API_KEY || "";
    if (!key) return NextResponse.json({ error: "XAI API key is missing" }, { status: 500 });

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const response = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "grok-imagine-video"
      })
    });

    const data = await response.json();
    console.log("Grok Video POST Response:", JSON.stringify(data, null, 2));

    if (!response.ok || !data.request_id) {
      console.log("Failed to start Grok video generation, falling back.");
      return NextResponse.json({ 
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        status: "done",
        note: "API Error. Using fallback placeholder video."
      });
    }

    return NextResponse.json({ request_id: data.request_id, status: "pending" });
  } catch (error: any) {
    console.log("Video Gen POST Error caught. Returning fallback.");
    return NextResponse.json({ 
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      status: "done",
      note: "Caught Error. Using fallback placeholder video."
    });
  }
}

// GET: Poll Video Status
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const request_id = url.searchParams.get("request_id");

    const key = process.env.XAI_API_KEY || "";
    if (!key) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    if (!request_id) return NextResponse.json({ error: "Missing request_id" }, { status: 400 });

    const response = await fetch(`https://api.x.ai/v1/videos/${request_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });

    const data = await response.json();
    console.log(`Grok Video GET Status (${request_id}):`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({ status: "failed", error: "Failed to poll xAI API" });
    }

    // Assuming xAI returns { status: 'done', url: '...', progress: 100 } or similar
    // We try multiple potential URL fields just in case
    const videoUrl = data.video?.url || data.url || data.result?.url || data.data?.[0]?.url;

    if (data.status === "done" && videoUrl) {
      return NextResponse.json({ status: "done", url: videoUrl });
    } else if (data.status === "failed") {
      return NextResponse.json({ status: "failed" });
    } else {
      // Pending or processing
      return NextResponse.json({ status: "pending", progress: data.progress || 0 });
    }

  } catch (error: any) {
    console.error("Video Gen GET Error:", error);
    return NextResponse.json({ status: "failed", error: error.message });
  }
}
