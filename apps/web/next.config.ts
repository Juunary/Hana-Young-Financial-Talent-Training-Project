import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" is enabled in Dockerfile for production builds.
  // Disabled locally due to Windows symlink permission issues.
};

export default nextConfig;
