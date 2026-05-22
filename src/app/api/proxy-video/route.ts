import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get("url");

    if (!videoUrl) {
      return new NextResponse("Missing URL", { status: 400 });
    }

    // Fetch the video from the remote server
    const response = await fetch(videoUrl);

    if (!response.ok) {
      return new NextResponse("Failed to fetch video", { status: response.status });
    }

    // Get the response body as a buffer/stream
    const arrayBuffer = await response.arrayBuffer();

    // Return the video with CORS headers allowing the frontend to access it
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "video/mp4",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Proxy Video Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
