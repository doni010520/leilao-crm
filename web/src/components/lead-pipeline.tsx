"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { updateLeadEstagio } from "@/app/(app)/pipeline/actions";
import type { PipelineOverview, LeadEstagio } from "@/lib/types-auction";

const COLUMNS: { estagio: LeadEstagio; title: string; dot: string; head: string }[] = [
  { estagio: "novo", title: "Novos", dot: "bg-gray-400", head: "text-gray-700" },
  { estagio: "qualificado", title: "Qualificados", dot: "bg-red-500", head: "text-red-700" },
  { estagio: "interessado", title: "Interessados", dot: "bg-amber-500", head: "text-amber-700" },
  { estagio: "em_negociacao", title: "Em Negociação", dot: "bg-blue-500", head: "text-blue-700" },
  { estagio: "proposta", title: "Proposta", dot: "bg-violet-500", head: "text-violet-700" },
  { estagio: "convertido", title: "Convertidos", dot: "bg-green-500", head: "text-green-700" },
];

const SCORE_COLORS: Record<string, string> = {
  quente: "bg-red-100 text-red-700",
  morno: "bg-amber-100 text-amber-700",
  curioso: "bg-blue-100 text-blue-600",
};

const PERFIL_LABELS: Record<string, string> = {
  investidor_experiente: "Investidor",
  iniciante: "Iniciante",
  casa_propria: "Casa própria",
  flipper: "Flipper",
  renteiro: "Renteiro",
  nao_definido: "—",
};

function formatCurrency(v: number | null) {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function LeadPipeline({ leads }: { leads: PipelineOverview[] }) {
  const router = useRouter();
  return (
    <div className="grid h-[calc(100vh-180px)] grid-cols-2 gap-3 overflow-hidden md:grid-cols-3 lg:grid-cols-6">
      {COLUMNS.map((col) => {
        const items = leads.filter((l) => l.estagio === col.estagio);
        return (
          <div key={col.estagio} className="flex min-h-0 flex-col rounded-card bg-gray-50/70">
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                <h3 className={cn("text-xs font-semibold", col.head)}>{col.title}</h3>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                {items.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {items.length === 0 && (
                <p className="pt-6 text-center text-[10px] text-ink-soft">Nenhum lead.</p>
              )}
              {items.map((lead) => {
                const initials = (lead.contact_name ?? lead.contact_phone)
                  .split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
                return (
                  <div
                    key={lead.id}
                    onClick={() => router.push(`/pipeline/${lead.contact_id}`)}
                    className="cursor-pointer rounded-lg bg-surface p-3 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                        {initials || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {lead.contact_name ?? lead.contact_phone}
                        </p>
                        <p className="truncate text-[10px] text-ink-soft">{lead.contact_phone}</p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold", SCORE_COLORS[lead.score_label])}>
                        {lead.score_valor}pts — {lead.score_label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] text-ink-soft">
                        {PERFIL_LABELS[lead.perfil] ?? lead.perfil}
                      </span>
                    </div>

                    {(lead.objetivo || lead.regiao_interesse) && (
                      <p className="mt-1.5 text-[10px] text-ink-soft">
                        {lead.objetivo && <span className="capitalize">{lead.objetivo}</span>}
                        {lead.objetivo && lead.regiao_interesse && " · "}
                        {lead.regiao_interesse}
                      </p>
                    )}

                    {(lead.faixa_valor_min || lead.faixa_valor_max) && (
                      <p className="mt-1 text-[10px] font-medium text-ink-soft">
                        💰 {formatCurrency(lead.faixa_valor_min)} — {formatCurrency(lead.faixa_valor_max)}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[9px] text-ink-soft">
                      {lead.deal_count > 0 && (
                        <span>🏠 {lead.deal_count} negócio{lead.deal_count > 1 ? "s" : ""}</span>
                      )}
                      {lead.last_message_at && (
                        <span>💬 {timeAgo(lead.last_message_at)}</span>
                      )}
                    </div>

                    {/* Stage change */}
                    <select
                      value={lead.estagio}
                      onClick={e => e.stopPropagation()}
                      onChange={async (e) => {
                        e.stopPropagation();
                        await updateLeadEstagio(lead.qualification_id, e.target.value);
                      }}
                      className="mt-2 w-full rounded border border-gray-200 bg-gray-50 px-1.5 py-1 text-[10px] text-ink-soft"
                    >
                      {COLUMNS.map(c => (
                        <option key={c.estagio} value={c.estagio}>{c.title}</option>
                      ))}
                      <option value="perdido">Perdido</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
