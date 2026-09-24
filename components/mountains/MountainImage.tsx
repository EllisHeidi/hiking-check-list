import Image from "next/image";

/**
 * Mountain cover photo, or a quiet ridge-line placeholder when the mountain
 * has no photo yet. Always fills its (relative) parent.
 */
export function MountainImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
  }
  return (
    <div role="img" aria-label={`${alt} — no photo yet`} className={`absolute inset-0 overflow-hidden bg-forest ${className}`}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id="mi-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#50634a" />
            <stop offset="1" stopColor="#1f3a2e" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#mi-sky)" />
        <path d="M0 230 L70 170 L110 195 L180 110 L235 160 L270 135 L340 190 L400 160 V300 H0 Z" fill="#2b4c3c" />
        <path d="M0 260 L60 225 L120 245 L200 190 L260 230 L320 205 L400 240 V300 H0 Z" fill="#1d1c1a" opacity="0.55" />
        <path d="M180 110 L198 128 L188 126 L180 134 L172 124 L164 128 Z" fill="#f4f0e8" opacity="0.5" />
      </svg>
    </div>
  );
}
