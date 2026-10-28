import type { MetadataRoute } from "next";

import { PUBLIC_ROUTES, SITE_URL } from "@/lib/site";

// /sitemap.xml: the public pages anyone can read without signing in. Event
// pages aren't listed: /events links to every open one.
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" || path === "/events" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/events" ? 0.8 : 0.5,
  }));
}
