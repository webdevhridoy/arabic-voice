import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "@/lib/usage";
import { normalizeArabicText } from "@/lib/utils/arabic";
import { streamElevenLabsAudio } from "@/lib/tts/elevenlabs";
import { checkTtsRateLimit } from "@/lib/rate-limit";
import { getAnonymousId } from "@/lib/get-ip";

// Vercel max duration — streaming needs a bit more headroom
export const maxDuration = 60;

/**
 * POST /api/tts/stream
 *
 * Streams audio directly from ElevenLabs to the browser.
 * The client receives an audio/mpeg stream and can start playing
 * within ~1-2 seconds instead of waiting for the full buffer.
 *
 * Usage is recorded asynchronously so it doesn't block the stream.
 */
export async function POST(req: NextRequest) {
  try {
    let { userId } = await auth();
    if (!userId) {
      userId = await getAnonymousId();
    }

    // ── Rate Limiting ──────────────────────────────────────────────────────
    const rateCheck = await checkTtsRateLimit(userId);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating again.", remaining: 0 },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const { text, voiceId = "ali" } = body as { text: string; voiceId?: string };

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.trim().length > 5000) {
      return NextResponse.json(
        { error: "النص طويل جداً. الحد الأقصى هو 5,000 حرف لكل طلب." },
        { status: 400 }
      );
    }

    const normalizedText = normalizeArabicText(text);
    const charactersCount = normalizedText.length;

    // ── Ensure user record exists ──────────────────────────────────────────
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `local-tester-${userId}@sawti.com`,
        name: "Local Tester",
      },
    });

    // ── Enforce usage limit ────────────────────────────────────────────────
    const usageCheck = await checkUsageLimit(userId, charactersCount);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: "Usage limit exceeded", remainingCharacters: usageCheck.remaining },
        { status: 403 }
      );
    }

    // ── Create DB record (non-blocking for the stream) ─────────────────────
    const generation = await prisma.audioGeneration.create({
      data: {
        userId,
        inputText: text,
        normalizedText,
        textHash: `stream-${Date.now()}`,
        charactersCount,
        voiceId,
        provider: "elevenlabs",
        status: "processing",
      },
    });

    const startTime = Date.now();

    // ── Stream from ElevenLabs ─────────────────────────────────────────────
    let elResponse: Response;
    try {
      elResponse = await streamElevenLabsAudio(normalizedText, voiceId);
    } catch (err: any) {
      await prisma.audioGeneration.update({
        where: { id: generation.id },
        data: {
          status: "failed",
          errorMessage: err.message || "ElevenLabs connection failed",
          generationTimeMs: Date.now() - startTime
        }
      }).catch(() => {});
      throw err;
    }

    if (!elResponse.body) {
      const err = new Error("No stream body from ElevenLabs");
      await prisma.audioGeneration.update({
        where: { id: generation.id },
        data: {
          status: "failed",
          errorMessage: err.message,
          generationTimeMs: Date.now() - startTime
        }
      }).catch(() => {});
      throw err;
    }

    const reader = elResponse.body.getReader();
    const chunks: Uint8Array[] = [];

    // Custom ReadableStream that intercepts chunks and completes DB transaction
    // before closing the stream so Vercel keeps the serverless function alive.
    const customClientStream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            // Stream complete! Process the gathered chunks and save to DB
            try {
              const audioBuffer = Buffer.concat(chunks);
              const base64Audio = `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`;
              const durationSeconds = charactersCount / 12;

              await prisma.$transaction([
                prisma.audioGeneration.update({
                  where: { id: generation.id },
                  data: {
                    status: "completed",
                    audioUrl: base64Audio,
                    durationSeconds,
                    generationTimeMs: Date.now() - startTime,
                    mimeType: "audio/mpeg",
                    fileSizeBytes: audioBuffer.byteLength,
                  },
                }),
                prisma.usageRecord.create({
                  data: { userId: userId!, charactersUsed: charactersCount, provider: "elevenlabs" },
                }),
              ]);
            } catch (dbErr) {
              console.error("Failed to save audio stream to database:", dbErr);
            }

            controller.close();
            return;
          }

          if (value) {
            chunks.push(value);
            controller.enqueue(value);
          }
        } catch (err: any) {
          console.error("Stream reader pull error:", err);
          await prisma.audioGeneration.update({
            where: { id: generation.id },
            data: {
              status: "failed",
              errorMessage: err.message || String(err),
              generationTimeMs: Date.now() - startTime
            }
          }).catch(() => {});
          controller.error(err);
        }
      },
      async cancel(reason) {
        console.warn(`Stream cancelled by client: ${reason}`);
        reader.releaseLock();
        await elResponse.body?.cancel().catch(() => {});

        await prisma.audioGeneration.update({
          where: { id: generation.id },
          data: {
            status: "failed",
            errorMessage: `Stream cancelled by client: ${reason}`,
            generationTimeMs: Date.now() - startTime
          }
        }).catch(() => {});
      }
    });

    // ── Return the stream immediately ──────────────────────────────────────
    return new Response(customClientStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Generation-Id": generation.id,
      },
    });
  } catch (err: any) {
    console.error("TTS Stream error:", err.message);

    const isQuota =
      err.message?.includes("quota_exceeded") ||
      err.message?.includes("401");

    if (isQuota) {
      return NextResponse.json(
        { error: "limit", details: "ElevenLabs quota exceeded." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Generation failed. Please try again.", details: err.message },
      { status: 500 }
    );
  }
}
