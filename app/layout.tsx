import type { Metadata } from "next";
import { parse } from "smol-toml";
import contentSource from "virtual:site-content";
import "./globals.css";

const content = parse(contentSource) as unknown as {
  site: { meta_title: string; meta_description: string };
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://julialifesciences.org";
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
const siteRoot = siteUrl.replace(/\/$/, "");
const socialImage = `${siteRoot}/og.png`;
const icon = `${siteRoot}/JuliaBHFlogo.svg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: content.site.meta_title,
  description: content.site.meta_description,
  icons: {
    icon,
    shortcut: icon,
  },
  openGraph: {
    title: content.site.meta_title,
    description: content.site.meta_description,
    images: [{ url: socialImage, width: 1734, height: 907, alt: "JuliaLifeSciences — One language. Every scale of life." }],
  },
  twitter: {
    card: "summary_large_image",
    title: content.site.meta_title,
    description: content.site.meta_description,
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><script src={`${assetPrefix}/carousel-counter.js`} defer /></head>
      <body>{children}</body>
    </html>
  );
}
