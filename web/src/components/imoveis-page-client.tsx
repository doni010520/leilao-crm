"use client";

import { useState } from "react";
import { Home, Upload, Radio, ArrowRight, Search, FileSpreadsheet, Plus, Sparkles } from "lucide-react";
import { PropertiesClient } from "@/components/properties-client";
import { ImportProperties } from "@/components/import-properties";
import { ScrapingSources } from "@/components/scraping-sources";
import { PageHeader, Card } from "@/components/ui";
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
  const isEmpty = initialProperties.length === 0;

  // When base is empty AND on "todos" tab, show onboarding instead
  if (isEmpty && tab === "todos") {
    return (
      <>
        <PageHeader
          title="Imóveis de Leilão"
          subtitle="Monte a base de imóveis que a IA vai apresentar aos seus leads"
        />

        {/* Onboarding hero */}
        <div className="mb-8 rounded-card border border-accent/30 bg-accent-light/40 p-6 animate-fade-up">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Sparkles size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Sua base de imóveis está vazia</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                A IA precisa de imóveis para apresentar aos clientes que entram em contato.
                Quanto mais imóveis na base, melhor o atendimento. Escolha como começar:
              </p>
            </div>
          </div>
        </div>

        {/* 3 action cards */}
        <div className="grid gap-4 md:grid-cols-3 animate-fade-up stagger-1">
          {/* Scraping */}
          <button
            onClick={() => setTab("fontes")}
            className="group flex flex-col items-start rounded-card border-2 border-stone-200 bg-surface p-6 text-left transition-all hover:border-brand hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light transition-colors group-hover:bg-brand group-hover:text-white text-brand">
              <Search size={28} />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-ink">Buscar em portais</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
              Ative a busca automática na <strong>Caixa, Zuk, Superbid</strong> e outros portais de leilão.
              Novos imóveis entram na base a cada 12 horas.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand transition-colors group-hover:text-brand-dark">
              Configurar fontes <ArrowRight size={16} />
            </div>
          </button>

          {/* Upload */}
          <button
            onClick={() => setTab("importar")}
            className="group flex flex-col items-start rounded-card border-2 border-stone-200 bg-surface p-6 text-left transition-all hover:border-accent hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light transition-colors group-hover:bg-accent group-hover:text-white text-accent">
              <FileSpreadsheet size={28} />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-ink">Importar planilha</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
              Tem uma planilha com imóveis? Faça upload de um <strong>.xlsx ou .csv</strong> e os
              imóveis entram na base da IA na hora.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent transition-colors group-hover:text-amber-700">
              Enviar planilha <ArrowRight size={16} />
            </div>
          </button>

          {/* Manual */}
          <button
            onClick={() => setTab("todos")}
            className="group flex flex-col items-start rounded-card border-2 border-dashed border-stone-300 bg-surface/50 p-6 text-left transition-all hover:border-stone-400 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-ink-soft transition-colors group-hover:bg-stone-200">
              <Plus size={28} />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-ink">Cadastrar manualmente</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
              Adicione imóveis um a um com todos os detalhes: endereço, valor, tipo de leilão,
              edital e mais.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-ink-soft transition-colors group-hover:text-ink">
              Cadastrar imóvel <ArrowRight size={16} />
            </div>
          </button>
        </div>

        {/* How it works */}
        <Card className="mt-8 animate-fade-up stagger-3">
          <h4 className="font-display text-sm font-bold text-ink">Como funciona</h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">1</span>
              <p className="text-xs leading-relaxed text-ink-soft">Você adiciona imóveis por qualquer uma das 3 formas acima</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">2</span>
              <p className="text-xs leading-relaxed text-ink-soft">A IA aprende sobre cada imóvel e passa a oferecê-los nas conversas</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">3</span>
              <p className="text-xs leading-relaxed text-ink-soft">Quando um lead se interessa, a IA calcula viabilidade e avisa você</p>
            </div>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Imóveis de Leilão"
        subtitle={isEmpty ? "Monte a base de imóveis que a IA vai apresentar aos seus leads" : `Base de imóveis que a IA apresenta aos seus leads`}
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
            {t.id === "todos" && !isEmpty && (
              <span className="hidden rounded-full bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand sm:inline">
                {initialProperties.length}
              </span>
            )}
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
