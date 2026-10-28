import type { Metadata, Viewport } from "next";
import { Geist_Mono, Space_Grotesk, Unbounded } from "next/font/google";
import { Suspense } from "react";

import { AppToaster } from "@/components/layout/app-toaster";
import { NoticeToast } from "@/components/layout/notice-toast";
import { TabBar } from "@/components/layout/tab-bar";
import {
  SiteHeader,
  SiteHeaderSkeleton,
} from "@/components/layout/site-header";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Monospace, for invite codes and other things people read out or copy.
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// The "HackHub" wordmark only (components/brand/logo.tsx, DESIGN.md).
const unbounded = Unbounded({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: "800",
});

// The landing page uses these as they are; every other page sets a short
// title ("Events") and the template adds " · HackHub". Public pages build
// theirs with pageMetadata() (lib/site), which repeats the social image.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "HackHub · Run a whole hackathon in one place",
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: "HackHub · Run a whole hackathon in one place",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "HackHub · Run a whole hackathon in one place",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// The browser chrome matches the Scoreboard ground (#0C0A08).
export const viewport: Viewport = {
  themeColor: "#0C0A08",
  colorScheme: "dark",
};

// Dark only (DESIGN.md: the Scoreboard theme has no light mode). The theme
// tokens live in globals.css; `dark` on <html> turns on the dark: variants the
// shadcn components use.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${spaceGrotesk.variable} ${geistMono.variable} ${unbounded.variable}`}
    >
      <body className="bg-background text-foreground font-sans antialiased">
        {/* The session is read inside Suspense: Cache Components is on. */}
        <Suspense fallback={<SiteHeaderSkeleton />}>
          <SiteHeader />
        </Suspense>
        {children}
        {/* Phones: the role's bottom tab bar (reads the session). */}
        <Suspense fallback={null}>
          <TabBar />
        </Suspense>
        <Suspense fallback={null}>
          <NoticeToast />
        </Suspense>
        {/* Top-center on phones (clear of the dock and tab bar), bottom-right on desktop. */}
        <AppToaster />
      </body>
    </html>
  );
}
