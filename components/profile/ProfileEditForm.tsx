"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { updateProfile, setAvatar, type ProfileState } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { downscaleImage, extensionFor } from "@/lib/images";
import { validatePhoto } from "@/lib/validation/hike";
import { Field, FormMessage, Input, SubmitButton, inputClass } from "@/components/ui/form";
import { Avatar } from "./Avatar";
import type { Profile } from "@/types";

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfile, undefined);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploading, start] = useTransition();
  const router = useRouter();

  function onAvatar(file: File | undefined) {
    if (!file) return;
    const problem = validatePhoto({ name: "Photo", type: file.type, size: file.size });
    if (problem || file.size > 5 * 1024 * 1024) {
      setAvatarError(problem ?? "Photo: larger than 5 MB.");
      return;
    }
    setAvatarError(null);
    start(async () => {
      const small = await downscaleImage(file, 600, 0.88);
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setAvatarError("Your session has expired.");
      const path = `${auth.user.id}/${crypto.randomUUID()}.${extensionFor(small.type)}`;
      const { error } = await supabase.storage.from("avatars").upload(path, small, { contentType: small.type });
      if (error) return setAvatarError("Upload failed. Try again.");
      const res = await setAvatar(path);
      if (!res.ok) return setAvatarError("Couldn't save your photo.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Avatar profile={profile} size={96} />
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-ink/25 px-4 font-mono text-xs uppercase tracking-[0.14em] hover:border-ink">
          {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
          {uploading ? "Uploading…" : "Change photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onAvatar(e.target.files?.[0])} disabled={uploading} />
        </label>
      </div>
      {avatarError && <FormMessage error={avatarError} />}

      <form action={action} className="space-y-6">
        <FormMessage error={state?.error} message={state?.message} />
        <Field label="Name" htmlFor="display_name">
          <Input id="display_name" name="display_name" maxLength={60} defaultValue={profile.display_name ?? ""} />
        </Field>
        <Field label="Username" htmlFor="username" hint="3–24 letters, numbers or underscores.">
          <Input id="username" name="username" required pattern="[A-Za-z0-9_]{3,24}" autoCapitalize="none" defaultValue={profile.username} />
        </Field>
        <Field label="Bio" htmlFor="bio">
          <textarea id="bio" name="bio" rows={3} maxLength={280} defaultValue={profile.bio ?? ""} placeholder="Chasing mountains." className={inputClass} />
        </Field>
        <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-ink/15 bg-stone-50 p-4">
          <input type="checkbox" name="is_public" defaultChecked={profile.is_public} className="mt-1 size-5 accent-forest" />
          <span>
            <span className="font-medium">Public profile</span>
            <span className="block text-sm text-slate">
              When off, only you can see your hikes, stats, photos and activity. Others see just your name and photo.
            </span>
          </span>
        </label>
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </form>
    </div>
  );
}
