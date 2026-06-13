import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const generation = await prisma.audioGeneration.findUnique({
      where: { id },
      select: { audioUrl: true, mimeType: true, status: true }
    });

    if (!generation) {
      return new NextResponse("Audio generation not found", { status: 404 });
    }

    if (generation.status !== "completed") {
      return new NextResponse("Audio is still processing or failed", { status: 400 });
    }

    if (!generation.audioUrl) {
      return new NextResponse("Audio file is missing", { status: 404 });
    }

    // Handle dummy/mock audio
    if (generation.audioUrl === "/dummy.mp3") {
       return NextResponse.redirect(new URL("/dummy.mp3", req.url));
    }

    // Handle old local paths
    if (generation.audioUrl.startsWith("/audio/")) {
       return NextResponse.redirect(new URL(generation.audioUrl, req.url));
    }

    // The audioUrl stores the Base64 Data URI: data:audio/mpeg;base64,...
    const parts = generation.audioUrl.split(",");
    if (parts.length !== 2) {
       return new NextResponse("Invalid audio format in database", { status: 500 });
    }

    const base64Data = parts[1];
    const buffer = Buffer.from(base64Data, "base64");

    // We MUST stream the response to bypass Vercel's strict 4.5MB Serverless response limit
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": generation.mimeType || "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable" // Cache forever
      }
    });
  } catch (err: any) {
    console.error("Audio streaming error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
