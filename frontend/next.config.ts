import type { NextConfig } from "next";

const projectRoot = import.meta.dirname;
const apiBaseUrl = (
  process.env.CARTURA_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");
const devTunnelHost = "qf0xcs7f-3000.uks1.devtunnels.ms";

const nextConfig: NextConfig = {
  allowedDevOrigins: [devTunnelHost],
  experimental: {
    serverActions: {
      // Dev Tunnels forwards the public host while preserving localhost as
      // the request origin. Both hosts are intentionally trusted for testing.
      allowedOrigins: ["localhost:3000", devTunnelHost],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  cacheComponents: true,
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/auth/:path*",
        destination: `${apiBaseUrl}/api/v1/auth/:path*`,
      },
    ];
  },
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
    };

    return config;
  },
};

export default nextConfig;
