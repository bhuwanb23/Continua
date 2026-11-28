import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Server routes read the frozen demo cache and benchmark artifacts from disk.
  // Include them explicitly so serverless deployments (e.g. Vercel) ship them.
  outputFileTracingIncludes: {
    "/**/*": [
      "./data/demo-cache/**/*",
      "./data/eval-set/**/*",
      "./data/synthetic/**/*",
      "./data/generator/**/*",
      "./artifacts/benchmark/**/*",
      "./artifacts/extraction/phase6-extracted-final/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
