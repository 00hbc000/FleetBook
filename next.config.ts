import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // VULN-07 : toutes les origines autorisées, aucun en-tête de protection ajouté.
  async headers() {
    return [{ source: "/api/:path*", headers: [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type" },
      { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
    ] }];
  },
};

export default nextConfig;
