import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/translate",
        destination: "https://vvvcoding.vercel.app/api/translate",
      },
      {
        source: "/api/diagnose",
        destination: "https://vvvcoding.vercel.app/api/diagnose",
      },
    ];
  },
};

export default nextConfig;
