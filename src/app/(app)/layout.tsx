import { AppSidebar } from "@/components/app-sidebar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-dvh bg-cream-50">
      <AppSidebar
        email={user.email ?? ""}
        name={profile?.full_name ?? null}
      />
      <main className="relative min-h-dvh md:pl-64">
        <div
          aria-hidden="true"
          className="dot-grid pointer-events-none absolute inset-0 opacity-45"
        />
        <div className="app-shell relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}
