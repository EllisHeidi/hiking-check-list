"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function setFollowing(targetId: string, follow: boolean): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to follow hikers." };
  if (!z.uuid().safeParse(targetId).success) return { ok: false, error: "Unknown hiker." };
  if (targetId === user.id) return { ok: false, error: "You can't follow yourself." };

  const supabase = await createClient();
  const { error } = follow
    ? await supabase
        .from("follows")
        .upsert(
          { follower_id: user.id, following_id: targetId },
          { onConflict: "follower_id,following_id", ignoreDuplicates: true },
        )
    : await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);

  if (error) return { ok: false, error: "Something went wrong. Try again." };
  revalidatePath("/profile/[username]", "page");
  revalidatePath("/activity");
  revalidatePath("/");
  return { ok: true };
}
