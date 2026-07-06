import type { NextConfig } from "next";

// ponytail: sin next-pwa — es webpack-only y Next 16 compila con Turbopack.
// manifest.json ya permite instalar la app; el service worker (offline)
// se añade en beta con @serwist/next o equivalente compatible.

const nextConfig: NextConfig = {
  // headers de seguridad básicos
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
