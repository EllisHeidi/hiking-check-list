"use client";

import { useOptimistic, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setFollowing } from "@/lib/actions/follows";
import { buttonClass } from "@/components/ui/form";

export function FollowButton({ targetId, initialFollowing }: { targetId: string; initialFollowing: boolean }) {
  const [following, setOptimistic] = useOptimistic(initialFollowing);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={following}
      onClick={() =>
        start(async () => {
          setOptimistic(!following);
          await setFollowing(targetId, !following);
        })
      }
      className={`${following ? buttonClass.secondary : buttonClass.primary} min-w-36`}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
