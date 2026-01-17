import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const headers: {
      headers: { key: string; value: string }[];
      source: string;
    }[] = [];
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
      headers.push({
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
        ],
        source: "/:path*",
      });
    }
    return headers;
  },
  serverExternalPackages: ["@supabase/supabase-js"],
};

export default nextConfig;
