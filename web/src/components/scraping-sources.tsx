"use client";

import { useState } from "react";
import { RefreshCw, Check, Clock, AlertTriangle, Globe, Building, ExternalLink } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { runScraper } from "@/app/(app)/imoveis/actions";

interface ScrapingSource {
  id: string;
  name: string;
  icon: string;
  url: string;
  description: string;
  totalImoveis: number;
  ultimaExecucao: string | null;
  status: "ativo" | "inativo" | "erro";
  enabled: boolean;
}

const MOCK_SOURCES: ScrapingSource[] = [
  {
    id: "caixa",
    name: "Caixa Econômica Federal",
    icon: "🏦",
    url: "https://venda-imoveis.caixa.gov.br",
    description: "Imóveis retomados da Caixa — maior volume de leilões no Brasil",
    totalImoveis: 0,
    ultimaExecucao: null,
    status: "inativo",
    enabled: false,
  },
  {
    id: "zuk",
    name: "Zuk Leilões",
    icon: "⚡",
    url: "https://www.zfraimoveis.com.br",
    description: "Plataforma parceira da Caixa para leilões online",
    totalImoveis: 0,
    ultimaExecucao: null,
    status: "inativo",
    enabled: false,
  },
  {
    id: "superbid",
    name: "Superbid",
    icon: "🔨",
    url: "https://www.superbid.net",
    description: "Referência em leilões online — múltiplos bancos e empresas",
    totalImoveis: 0,
    ultimaExecucao: null,
    status: "inativo",
    enabled: false,
  },
  {
    id: "mega",
    name: "Mega Leilões",
    icon: "📢",
    url: "https://www.megaleiloes.com.br",
    description: "Leilões judiciais e extrajudiciais em todo o Brasil",
    totalImoveis: 0,
    ultimaExecucao: null,
    status: "inativo",
    enabled: false,
  },
  {
    id: "sodre",
    name: "Sodré Santoro",
    icon: "🏛️",
    url: "https://www.soldainteligente.com.br",
    description: "Leiloeiro tradicional — foco em imóveis de alto valor",
    totalImoveis: 0,
    ultimaExecucao: null,
    status: "inativo",
    enabled: false,
  },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "Nunca executado";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Há menos de 1h";
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Há ${days} dia${days > 1 ? "s" : ""}`;
}

export function ScrapingSources() {
  const [sources, setSources] = useState<ScrapingSource[]>(MOCK_SOURCES);
  const [running, setRunning] = useState<string | null>(null);

  function toggleSource(id: string) {
    setSources(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled, status: !s.enabled ? "ativo" : "inativo" } : s
    ));
  }

  async function runNow(id: string) {
    setRunning(id);
    try {
      // Map source id to estados
      const estadosMap: Record<string, string[]> = {
        caixa: ["SP","RJ","MG","PR","RS","BA","PE","CE","DF","GO"],
        zuk: ["SP","RJ"],
        superbid: ["SP","RJ"],
        mega: ["SP","RJ","MG"],
        sodre: ["SP"],
      };
      const estados = estadosMap[id] || ["SP"];
      const result = await runScraper(estados);
      setSources(prev => prev.map(s =>
        s.id === id ? { ...s, ultimaExecucao: new Date().toISOString(), status: "ativo" as const } : s
      ));
      alert(result?.message || "Scraper iniciado! Os imóveis aparecerão em alguns minutos.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao acionar scraper");
    } finally {
      setRunning(null);
    }
  }

  const totalAtivos = sources.filter(s => s.enabled).length;
  const totalImoveis = sources.reduce((sum, s) => sum + s.totalImoveis, 0);

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-ink">Fontes automáticas de imóveis</h3>
          <p className="text-sm text-ink-soft">
            O scraper busca imóveis automaticamente nos sites abaixo e adiciona à base da IA.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="font-display text-2xl font-bold text-ink">{totalAtivos}</p>
          <p className="text-xs text-ink-soft">Fontes ativas</p>
        </Card>
        <Card className="text-center">
          <p className="font-display text-2xl font-bold text-ink">{totalImoveis}</p>
          <p className="text-xs text-ink-soft">Imóveis captados</p>
        </Card>
        <Card className="text-center">
          <p className="font-display text-2xl font-bold text-ink">12h</p>
          <p className="text-xs text-ink-soft">Intervalo de busca</p>
        </Card>
      </div>

      {/* Sources list */}
      <div className="space-y-3">
        {sources.map(source => (
          <Card key={source.id} className={cn("transition-all", source.enabled && "border-brand/30")}>
            <div className="flex items-start gap-4">
              <span className="text-2xl">{source.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-ink">{source.name}</h4>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    source.status === "ativo" ? "bg-success-bg text-green-700" :
                    source.status === "erro" ? "bg-red-50 text-red-600" :
                    "bg-stone-100 text-stone-500"
                  )}>
                    {source.status === "ativo" ? "Ativo" : source.status === "erro" ? "Erro" : "Inativo"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">{source.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
                  <span className="flex items-center gap-1">
                    <Building size={12} /> {source.totalImoveis} imóveis
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {timeAgo(source.ultimaExecucao)}
                  </span>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline">
                    <Globe size={12} /> Site <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {source.enabled && (
                  <Button
                    variant="ghost"
                    onClick={() => runNow(source.id)}
                    disabled={running === source.id}
                    className="text-xs"
                  >
                    <RefreshCw size={14} className={running === source.id ? "animate-spin" : ""} />
                    {running === source.id ? "Buscando..." : "Rodar agora"}
                  </Button>
                )}
                <button
                  onClick={() => toggleSource(source.id)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    source.enabled ? "bg-brand" : "bg-stone-300"
                  )}
                  role="switch"
                  aria-checked={source.enabled}
                  aria-label={`${source.enabled ? "Desativar" : "Ativar"} ${source.name}`}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    source.enabled && "translate-x-5"
                  )} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-stone-200 bg-stone-50">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="text-xs text-ink-soft">
            <p className="font-semibold text-ink">Sobre o scraping</p>
            <p className="mt-1">
              O scraper busca imóveis nos sites oficiais a cada 12 horas. Imóveis novos são adicionados
              automaticamente à base da IA. Imóveis que não estão mais disponíveis são marcados como encerrados.
              O scraping não substitui a conferência manual do edital antes de dar um lance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
