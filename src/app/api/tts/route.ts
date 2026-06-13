import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "@/lib/usage";
import { normalizeArabicText, generateTextHash } from "@/lib/utils/arabic";
import { generateAudioBuffer } from "@/lib/tts/index";
import { checkTtsRateLimit } from "@/lib/rate-limit";
import { getAnonymousId } from "@/lib/get-ip";

// Removed Upstash and BullMQ for purely local synchronous generation workflow
export const maxDuration = 60; // Allow up to 60 seconds for Vercel Hobby tier

export async function POST(req: Request) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = await getAnonymousId();
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────
    const rateCheck = await checkTtsRateLimit(userId);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating again.", remaining: 0 },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const { text, voiceId = "ali" } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Hard server-side cap — never send more than 5,000 chars to ElevenLabs
    if (text.trim().length > 5000) {
      return NextResponse.json(
        { error: "النص طويل جداً. الحد الأقصى هو 5,000 حرف لكل طلب." },
        { status: 400 }
      );
    }

    // Ensure mock user exists to prevent foreign key errors in local sqlite db
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `local-tester-${userId}@sawti.com`,
        name: "Local Tester"
      }
    });

    const normalizedText = normalizeArabicText(text);
    const charactersCount = normalizedText.length;
    const textHash = await generateTextHash(normalizedText, voiceId, "elevenlabs", "eleven_multilingual_v2");

    // 1. Check for cached generation (same text + voice)
    const existingCache = await prisma.audioGeneration.findFirst({
      where: { textHash, status: "completed", audioUrl: { not: null } }
    });

    if (existingCache) {
      return NextResponse.json({
        success: true,
        cached: true,
        audioUrl: `/api/audio/${existingCache.id}`,
        generationId: existingCache.id
      });
    }

    // 2. Enforce Usage Limit
    const usageCheck = await checkUsageLimit(userId, charactersCount);
    
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: "Usage limit exceeded", 
        remainingCharacters: usageCheck.remaining 
      }, { status: 403 });
    }

    // 3. Create Processing Record
    const generation = await prisma.audioGeneration.create({
      data: {
        userId,
        inputText: text,
        normalizedText,
        textHash,
        charactersCount,
        voiceId,
        provider: "elevenlabs",
        status: "processing",
      }
    });

    // 4. Generate Synchronously 
    const startTime = Date.now();
    try {
      const audioBuffer = await generateAudioBuffer(normalizedText, voiceId, "elevenlabs");
      const durationSeconds = charactersCount / 12; // Crude approximation
      
      // Save as Base64 Data URI to avoid Vercel Read-Only File System errors (EROFS)
      // and immediately serve the file without external storage.
      const base64Audio = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString("base64")}`;

      // 5. Complete state and charge usage
      const isMock = audioBuffer.byteLength < 5000;
      const finalAudioUrl = isMock ? `/dummy.mp3` : base64Audio;

      await prisma.$transaction([
        prisma.audioGeneration.update({
          where: { id: generation.id },
          data: {
            status: "completed",
            audioUrl: finalAudioUrl, 
            durationSeconds,
            generationTimeMs: Date.now() - startTime,
            mimeType: "audio/mpeg",
            fileSizeBytes: audioBuffer.byteLength
          }
        }),
        prisma.usageRecord.create({
          data: { userId, charactersUsed: charactersCount, provider: "elevenlabs" }
        })
      ]);

      return NextResponse.json({
        success: true,
        pending: false,
        generationId: generation.id,
        audioUrl: isMock ? `/dummy.mp3` : `/api/audio/${generation.id}`,
        status: "completed"
      });

    } catch (err: any) {
      const isQuotaError =
        err.message?.includes("quota_exceeded") ||
        err.message?.includes("Status 401");

      // Mark record as failed
      await prisma.audioGeneration.update({
        where: { id: generation.id },
        data: { status: "failed", errorMessage: err.message, generationTimeMs: Date.now() - startTime }
      });

      // Surface quota errors as 429 so the client shows the upgrade modal
      if (isQuotaError) {
        return NextResponse.json(
          { error: "limit", details: "ElevenLabs quota exceeded — please upgrade your plan." },
          { status: 429 }
        );
      }
      throw err;
    }

  } catch (error) {
    console.error("TTS API Route Error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);

    // Quota / auth errors from ElevenLabs — surface as 429 to trigger upgrade modal
    if (errMsg.includes("quota_exceeded") || errMsg.includes("Status 401")) {
      return NextResponse.json(
        { error: "limit", details: "ElevenLabs quota exceeded — please upgrade your Sawti plan." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "حدث خطأ أثناء التوليد. حاول مرة أخرى بنص أقصر.", details: errMsg },
      { status: 500 }
    );
  }
}

