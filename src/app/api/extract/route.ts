import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    // Use Jina Reader API (free, no API key required) to extract article text
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "text/plain",
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to extract text from URL" }, { status: 400 });
    }

    let text = await res.text();
    
    // Clean up basic markdown links like [Link Text](https://...) -> Link Text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    // Clean up images
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "");
    // Clean up markdown hashes and asterisks
    text = text.replace(/[#*`_>]/g, "");

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
