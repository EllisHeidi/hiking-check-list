"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { buttonClass } from "@/components/ui/styles";

function profileUrl(username: string) {
  return `${window.location.origin}/profile/${encodeURIComponent(username)}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Native share sheet on phones; copies the link everywhere else. */
export function ShareProfileButton({
  username,
  name,
  isSelf,
  variant = "secondary",
}: {
  username: string;
  name: string;
  isSelf: boolean;
  variant?: "secondary" | "primary";
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = profileUrl(username);
    const text = isSelf
      ? "Follow my road to the summit on Mountain Kill List"
      : `${name} on Mountain Kill List`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: `${name} (@${username})`, text, url });
        return;
      } catch {
        // Cancelled or unsupported — fall back to copying.
      }
    }
    if (await copy(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button type="button" onClick={onShare} className={buttonClass[variant]} aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {copied ? "Link copied" : isSelf ? "Share profile" : "Share"}
    </button>
  );
}

/** Your profile link in a read-only field with a copy button. */
export function ProfileLinkField({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/profile/${username}`;

  return (
    <div className="flex gap-2">
      <input
        readOnly
        aria-label="Your profile link"
        value={typeof window === "undefined" ? path : profileUrl(username)}
        onFocus={(e) => e.currentTarget.select()}
        className="block min-w-0 flex-1 rounded-sm border border-ink/20 bg-stone-50 px-3.5 py-3 font-mono text-sm text-ink"
        suppressHydrationWarning
      />
      <button
        type="button"
        onClick={async () => {
          if (await copy(profileUrl(username))) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }}
        className={buttonClass.secondary}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
