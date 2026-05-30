import { fontVars } from "@/lib/fonts";

// Public read-only share links are not localized and live outside the auth
// wall, so they render their own <html>/<body> (the root layout is a
// pass-through).
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
