import { SiteFooter } from "@/components/layout/site-footer";

// Public pages (landing, /events, event pages, about, privacy, terms,
// contact): the page, then the site footer. The footer reads no data, so this
// layout needs no Suspense of its own.
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
