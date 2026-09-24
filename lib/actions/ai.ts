"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Generate a cover image for a mountain with OpenAI and store it in the public
 * mountain-images bucket. Only allowed when the mountain has no cover yet, or
 * for its creator (enforced again by set_mountain_image in the database).
 * The file is prefixed "ai-" so the UI can label it as AI-generated.
 */
export async function generateMountainCover(mountainId: string): Promise<Result> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI covers aren't set up (OPENAI_API_KEY is missing)." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!z.uuid().safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };

  const supabase = await createClient();
  const { data: m } = await supabase
    .from("mountains")
    .select("id, name, elevation, region, country, image_url, created_by")
    .eq("id", mountainId)
    .maybeSingle();
  if (!m) return { ok: false, error: "Unknown mountain." };
  if (m.image_url && m.created_by !== user.id) return { ok: false, error: "This mountain already has a cover photo." };

  const place = [m.region, m.country].filter(Boolean).join(", ");
  const prompt =
    `Editorial landscape photograph of ${m.name}${m.elevation ? ` (${m.elevation} m)` : ""}` +
    `${place ? `, ${place}` : ""}. Realistic mountain scenery seen from a hiking trail, natural light, ` +
    `muted earthy tones, wide angle, no people, no text, no watermark.`;

  let b64: string | undefined;
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt,
        size: "1536x1024",
        quality: "medium",
        output_format: "jpeg",
        n: 1,
      }),
    });
    const json = (await res.json()) as { data?: { b64_json?: string }[]; error?: { message?: string } };
    if (!res.ok) return { ok: false, error: `Image generation failed: ${json.error?.message ?? res.statusText}` };
    b64 = json.data?.[0]?.b64_json;
  } catch {
    return { ok: false, error: "Couldn't reach the image service. Try again." };
  }
  if (!b64) return { ok: false, error: "The image service returned no image." };

  const path = `${user.id}/ai-${crypto.randomUUID()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("mountain-images")
    .upload(path, Buffer.from(b64, "base64"), { contentType: "image/jpeg" });
  if (upErr) return { ok: false, error: "Couldn't save the generated image." };

  const { data: pub } = supabase.storage.from("mountain-images").getPublicUrl(path);
  const { data: ok } = await supabase.rpc("set_mountain_image", { p_mountain: mountainId, p_url: pub.publicUrl });
  if (!ok) {
    await supabase.storage.from("mountain-images").remove([path]);
    return { ok: false, error: "This mountain already has a cover photo." };
  }

  revalidatePath("/mountains/[slug]", "page");
  revalidatePath("/mountains");
  revalidatePath("/");
  return { ok: true };
}
