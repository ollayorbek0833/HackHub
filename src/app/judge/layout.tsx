// Every page under /judge renders inside this <main>, so pages return their
// content only. A layout is never the authorization check (docs/07 > Route
// groups): every judge page and action calls requireRole("JUDGE") itself.
export default function JudgeLayout({ children }: LayoutProps<"/judge">) {
  return <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>;
}
