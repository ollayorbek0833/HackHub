import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// /robots.txt. Public pages are open to crawlers; the signed-in areas (they
// only redirect to the login page) and the API are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/organizer",
        "/judge",
        "/my-events",
        "/profile",
        "/events/*/team",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
