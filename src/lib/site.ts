import type { Metadata } from "next";

// Site-wide facts for metadata, robots.txt and the sitemap. The production URL
// is fixed (PRODUCT.md > Operating Context); og:url, canonical links and the
// sitemap always point there, even on a local build.

export const SITE_URL = "https://hackhub.mekhroj.uz";
export const SITE_NAME = "HackHub";
export const SITE_DESCRIPTION =
  "Run a whole hackathon in one place: registration, teams, project submissions, fair weighted judging and a published ranking.";
export const REPO_URL = "https://github.com/ollayorbek0833/HackHub";

/** The social card: public/og.png (Podium H, wordmark and tagline on the ground). */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "HackHub: run a whole hackathon in one place",
} as const;

/** Pages listed in sitemap.xml: public and readable without signing in. */
export const PUBLIC_ROUTES = [
  "/",
  "/events",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/register",
] as const;

/**
 * A public page's metadata: the title (the root layout adds " · HackHub"), the
 * description, its canonical URL, and Open Graph and Twitter tags that repeat
 * them. Next.js replaces openGraph and twitter as a whole per segment, so each
 * page sets the image again here rather than inheriting it.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${title} · ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
