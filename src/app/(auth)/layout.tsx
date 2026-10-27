// /login and /register: one centred card. The layout reads no data, so it
// needs no Suspense of its own (the pages' data is under loading.tsx).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10 sm:py-16">
      {children}
    </main>
  );
}
