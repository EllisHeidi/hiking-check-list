"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { buttonClass } from "@/components/ui/styles";

// Chrome/Edge/Android fire this when the app can be installed.
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of the mini-infobar
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * "Install app": triggers the browser's install prompt where supported
 * (Android, desktop Chrome/Edge) and shows Add-to-Home-Screen steps on iPhone.
 * Renders nothing when already installed or not installable.
 */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden");
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    // Decide after mount — install support is only known in the browser.
    const next = isStandalone() ? "hidden" : canPrompt ? "prompt" : isIOS() ? "ios" : "hidden";
    const id = requestAnimationFrame(() => setMode(next));
    return () => cancelAnimationFrame(id);
  }, [canPrompt]);

  if (mode === "hidden") return null;

  async function onClick() {
    if (mode === "ios") return setShowSteps(true);
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    listeners.forEach((l) => l());
  }

  return (
    <>
      <button type="button" onClick={onClick} className={`${buttonClass.secondary} ${className}`}>
        <Download className="size-4" aria-hidden /> Install app
      </button>

      {showSteps && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 sm:items-center"
          onClick={() => setShowSteps(false)}
        >
          <div className="w-full max-w-sm animate-rise rounded-sm bg-paper p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <p id="install-title" className="font-display text-3xl">Install on iPhone</p>
              <button
                type="button"
                onClick={() => setShowSteps(false)}
                className="-mt-1 -mr-2 inline-flex size-11 items-center justify-center text-slate hover:text-ink"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <ol className="mt-4 space-y-3 text-charcoal">
              <li className="flex items-center gap-3">
                <span className="font-mono text-sm text-ember">1</span>
                Tap <Share className="size-5 text-forest" aria-label="the Share button" /> in Safari&apos;s toolbar
              </li>
              <li className="flex items-center gap-3">
                <span className="font-mono text-sm text-ember">2</span>
                Choose <SquarePlus className="size-5 text-forest" aria-hidden /> <strong>Add to Home Screen</strong>
              </li>
            </ol>
            <p className="mt-4 text-sm text-mist">It opens full-screen with the Mountain Kill List icon, like any other app.</p>
          </div>
        </div>
      )}
    </>
  );
}
