"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const expanded = pinned || hovered;

  useEffect(() => {
    setPinned(localStorage.getItem("sb-pinned") === "1");
  }, []);

  function togglePin() {
    setPinned((p) => {
      localStorage.setItem("sb-pinned", p ? "0" : "1");
      return !p;
    });
  }

  return (
    <div className="w-[72px] shrink-0">
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Menu lateral"
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-stone-200/60 bg-surface py-3 transition-all duration-200",
          expanded ? "w-60 px-3 shadow-2xl" : "w-[72px] items-center px-2",
        )}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          aria-label="LeilãoCRM — Ir para o Dashboard"
          className={cn("mb-2 flex items-center gap-2.5", expanded ? "px-1" : "justify-center")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-9 w-9 shrink-0" aria-hidden="true" />
          {expanded && (
            <span className="whitespace-nowrap font-display text-lg font-bold tracking-tight text-ink">
              Leilão<span className="text-accent">CRM</span>
            </span>
          )}
        </Link>

        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {NAV.map((group) => (
            <div key={group.title} className="flex flex-col gap-0.5 py-1">
              {expanded ? (
                <span className="whitespace-nowrap px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft/70">
                  {group.title}
                </span>
              ) : (
                <span className="mx-auto my-1 h-px w-6 bg-stone-200" aria-hidden="true" />
              )}
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center rounded-xl transition-all duration-150",
                      expanded ? "gap-3 px-3 py-2" : "h-11 w-11 justify-center",
                      active
                        ? "bg-brand text-white shadow-sm"
                        : "text-ink-soft hover:bg-stone-100 hover:text-ink",
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    {expanded && <span className="truncate whitespace-nowrap text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-2 flex flex-col gap-1 border-t border-stone-200/60 pt-2">
          <button
            onClick={togglePin}
            aria-label={pinned ? "Soltar menu lateral" : "Fixar menu lateral aberto"}
            className={cn(
              "flex items-center rounded-xl text-ink-soft transition hover:bg-stone-100 hover:text-ink",
              expanded ? "gap-3 px-3 py-2" : "h-11 w-11 justify-center",
            )}
          >
            {pinned ? <PanelLeftClose size={20} className="shrink-0" /> : <PanelLeftOpen size={20} className="shrink-0" />}
            {expanded && <span className="whitespace-nowrap text-sm font-medium">{pinned ? "Soltar menu" : "Fixar menu"}</span>}
          </button>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              aria-label="Sair da conta"
              className={cn(
                "flex w-full items-center rounded-xl text-danger transition hover:bg-red-50",
                expanded ? "gap-3 px-3 py-2" : "h-11 w-11 justify-center",
              )}
            >
              <LogOut size={20} className="shrink-0" />
              {expanded && <span className="whitespace-nowrap text-sm font-medium">Sair</span>}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
