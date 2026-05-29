import { createServerClient } from "@/lib/auth/supabase-server";

export default async function CapTablePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Welcome to Free<span className="text-brand-600">C</span>apT
      </div>
      <p className="mt-3 text-sm text-slate-500">{user?.email}</p>
    </main>
  );
}
