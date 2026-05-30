import type { Metadata } from "next";

// The sign-in page is a client component, so its SEO metadata lives here.
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to FreeCapT with a magic link - no passwords. The free cap table for founders and small businesses.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
