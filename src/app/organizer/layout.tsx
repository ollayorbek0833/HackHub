// Every page under /organizer renders inside this <main>, so pages return
// their content only. A layout is never the authorization check (docs/07 >
// Route groups): every organizer page and action calls requireRole itself.
export default function OrganizerLayout({
  children,
}: LayoutProps<"/organizer">) {
  return <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>;
}
