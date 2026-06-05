"use client";

import { useState } from "react";
import { Home, Upload, Radio } from "lucide-react";
import { PropertiesClient } from "@/components/properties-client";
import { ImportProperties } from "@/components/import-properties";
import { ScrapingSources } from "@/components/scraping-sources";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/types-auction";

const TABS = [
  { id: "todos", label: "Todos os imóveis", icon: Home },
  { id: "importar", label: "Importar planilha", icon: Upload },
  { id: "fontes", label: "Fontes automáticas", icon: Radio },
] as const;

type TabId = typeof TABS[number]["id"];

export function ImoveisPageClient({ initialProperties }: { initialProperties: Property[] }) {
  const [tab, setTab] = useState<TabId>("todos");

  return (
    <>
      <PageHeader
        title="Imóveis de Leilão"
        subtitle="Base de imóveis que a IA apresenta aos seus leads"
      />

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-xl border border-stone-200/60 bg-stone-100/60 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              tab === t.id
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <t.icon size={16} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "todos" && <PropertiesClient initialProperties={initialProperties} />}
      {tab === "importar" && <ImportProperties />}
      {tab === "fontes" && <ScrapingSources />}
    </>
  );
}
