"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";
import type { PipelineOverview, Activity, Deal, Task } from "@/lib/types-auction";

const SCORE_CLS: Record<string, string> = {
  quente: "bg-red-100 text-red-700",
  morno: "bg-amber-100 text-amber-700",
  curioso: "bg-blue-100 text-blue-600",
};
const PERFIL: Record<string, string> = {
  investidor_experiente: "Investidor Experiente",
  iniciante: "Iniciante", casa_propria: "Casa Própria",
  flipper: "Flipper", renteiro: "Renteiro", nao_definido: "Não definido",
};
const ACTIVITY_ICONS: Record<string, string> = {
  qualificacao: "🎯", simulacao: "🧮", interesse: "❤️", handoff: "🤝",
  nota: "📝", ligacao: "📞", email: "✉️", visita: "🏠",
  lance: "🔨", arrematacao: "🏆", sistema: "⚙️",
};

function fmt(v: number | null) {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function LeadDetail({
  lead, activities, deals, tasks,
}: {
  lead: PipelineOverview;
  activities: Activity[];
  deals: Deal[];
  tasks: Task[];
}) {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
          {(lead.contact_name ?? "?").split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("")}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-ink">{lead.contact_name ?? lead.contact_phone}</h1>
          <p className="text-sm text-ink-soft">{lead.contact_phone}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", SCORE_CLS[lead.score_label])}>
              Score {lead.score_valor} — {lead.score_label}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-ink-soft">
              {PERFIL[lead.perfil] ?? lead.perfil}
            </span>
            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">
              {lead.estagio.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Qualification + Deals */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-ink">Qualificação</h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Objetivo", lead.objetivo],
                ["Região", lead.regiao_interesse],
                ["Faixa", lead.faixa_valor_min || lead.faixa_valor_max
                  ? `${fmt(lead.faixa_valor_min)} — ${fmt(lead.faixa_valor_max)}` : null],
                ["Pagamento", lead.forma_pagamento],
                ["Capital", lead.capital_disponivel === true ? "✅ Sim" : lead.capital_disponivel === false ? "❌ Não" : null],
                ["Prazo", lead.prazo_compra],
                ["Já arrematou", lead.ja_arrematou === true ? "✅ Sim" : lead.ja_arrematou === false ? "❌ Não" : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {lead.notas_corretor && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-ink-soft">
                <strong>Notas:</strong> {lead.notas_corretor}
              </div>
            )}
          </Card>

          {deals.length > 0 && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-ink">Negócios ({deals.length})</h3>
              <div className="space-y-2">
                {deals.map(d => (
                  <div key={d.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-ink">{d.title}</p>
                    <p className="mt-1 text-xs text-ink-soft">{fmt(d.valor_pretendido)} · {d.status}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tasks.length > 0 && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-ink">Tarefas ({tasks.length})</h3>
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span>{t.completed ? "✅" : "⬜"}</span>
                    <span className={t.completed ? "text-ink-soft line-through" : "text-ink"}>{t.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column: Activity timeline */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-ink">Timeline de Atividades</h3>
            {activities.length === 0 ? (
              <p className="text-center text-sm text-ink-soft">Nenhuma atividade registrada.</p>
            ) : (
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute bottom-0 left-4 top-0 w-px bg-gray-200" />

                {activities.map((a, i) => (
                  <div key={a.id} className="relative flex gap-4 pb-6">
                    <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-base shadow-sm ring-1 ring-gray-200">
                      {ACTIVITY_ICONS[a.tipo] ?? "📌"}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm text-ink">{a.descricao}</p>
                      <p className="mt-1 text-[11px] text-ink-soft">{fmtDate(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
