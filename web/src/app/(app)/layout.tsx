import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  let userName = "Adonias Souza";
  let orgName = "ImobLeilão CRM (preview)";
  let email: string | undefined;
  let role = "admin";

  if (hasEnv) {
    const session = await getSession();
    if (!session) redirect("/login");
    if (!session.organization) redirect("/onboarding");
    userName = session.profile?.name || session.profile?.email || "Usuário";
    orgName = session.organization.name;
    email = session.profile?.email ?? undefined;
    role = session.profile?.role ?? "agent";
  }

  return (
    <AppShell userName={userName} orgName={orgName} email={email} role={role} hasEnv={hasEnv}>
      {children}
    </AppShell>
  );
}
