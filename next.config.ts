import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Mountain cover photos
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage: public avatars + signed hike-photo URLs
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
      ...(supabaseHost && !supabaseHost.endsWith(".supabase.co")
        ? [{ hostname: supabaseHost, pathname: "/storage/v1/**" }]
        : []),
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" }, // photos go straight to Storage, never through actions
  },
};

export default nextConfig;
