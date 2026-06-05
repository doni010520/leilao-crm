"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, MessageCircle, User, LogOut, ChevronDown, Menu } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

export function Topbar({
  userName,
  orgName,
  email,
  onMenuOpen,
}: {
  userName: string;
  orgName: string;
  email?: string;
  onMenuOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200/60 bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-stone-100 hover:text-ink lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <Link
          href="/atendimento"
          aria-label="Acessar o chat de atendimento"
          className="hidden items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-brand sm:flex"
        >
          <MessageCircle size={18} />
          <span>Acessar o chat</span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <span
          aria-label={`Versão ${APP_VERSION}`}
          className="mr-1 hidden rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-soft sm:inline"
        >
          {APP_VERSION}
        </span>
        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-stone-100 hover:text-ink sm:flex"
        >
          <Settings size={18} />
        </Link>

        <div className="relative ml-1">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label="Menu da conta"
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-stone-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm">
              {initials || "?"}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="max-w-[140px] truncate text-sm font-semibold text-ink">{userName}</p>
              <p className="max-w-[140px] truncate text-xs text-ink-soft">{orgName}</p>
            </div>
            <ChevronDown size={15} className={`hidden text-ink-soft transition-transform sm:block ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
              <div
                role="menu"
                className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-xl border border-stone-200/60 bg-surface shadow-xl animate-fade-up"
              >
                <div className="border-b border-stone-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-ink">{userName}</p>
                  {email && <p className="truncate text-xs text-ink-soft">{email}</p>}
                  <p className="mt-0.5 truncate text-[11px] font-medium text-accent">{orgName}</p>
                </div>
                <Link href="/perfil" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-stone-50">
                  <User size={15} /> Meu perfil
                </Link>
                <Link href="/ajustes" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-stone-50">
                  <Settings size={15} /> Ajustes
                </Link>
                <form action="/auth/signout" method="post" className="border-t border-stone-100">
                  <button type="submit" role="menuitem" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger hover:bg-red-50">
                    <LogOut size={15} /> Sair
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
