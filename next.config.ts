import type { NextConfig } from "next";

const assetPrefix = process.env.PAGES_ASSET_PREFIX ?? "";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix,
  env: { NEXT_PUBLIC_ASSET_PREFIX: assetPrefix },
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
