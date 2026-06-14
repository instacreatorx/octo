import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".moz", // 👈 changes the build output folder
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;