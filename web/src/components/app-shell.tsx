"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export function AppShell({
  userName, orgName, email, role, hasEnv, children,
}: {
  userName: string; orgName: string; email?: string; role: string; hasEnv: boolean;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userName={userName}
          orgName={orgName}
          email={email}
          onMenuOpen={() => setMobileMenuOpen(true)}
        />
        {!hasEnv && (
          <div className="mx-4 mb-2 rounded-lg bg-amber-100 px-4 py-2 text-xs text-amber-800 lg:mx-6">
            Modo preview — Supabase não configurado.
          </div>
        )}
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
