import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow opening the dev server from a phone on the same LAN.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
