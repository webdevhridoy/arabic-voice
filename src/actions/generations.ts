"use server";

import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "@/lib/usage";
import { auth } from "@clerk/nextjs/server";
import { getAnonymousId } from "@/lib/get-ip";

export async function getUserGenerations(limit: number = 10) {
  let { userId } = await auth();
  if (!userId) {
    userId = await getAnonymousId();
  }

  const generations = await prisma.audioGeneration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      inputText: true,
      // intentionally omitted audioUrl to prevent crashing Vercel with 6MB payloads per row
      durationSeconds: true,
      status: true,
      createdAt: true,
      provider: true,
      voiceId: true,
      errorMessage: true
    }
  });

  return generations.map(g => ({
    ...g,
    // Provide a dynamic URL so the client streams the audio from our new API
    audioUrl: g.status === "completed" ? `/api/audio/${g.id}` : null
  }));
}

export async function getUserUsageStats() {
  let { userId } = await auth();
  if (!userId) {
    userId = await getAnonymousId();
  }
  return await checkUsageLimit(userId, 0);
}
