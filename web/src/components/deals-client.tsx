"use client";

import { useState } from "react";
import { Plus, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, Button, Card, EmptyState } from "@/components/ui";
import { DealForm } from "@/components/deal-form";
import { updateDealStatus } from "@/app/(app)/negocios/actions";
import type { Deal, DealStatus } from "@/lib/types-auction";

const STATUS_MAP: Record<DealStatus, { label: string; cls: string }> = {
  acompanhando: { label: "Acompanhando", cls: "bg-blue-100 text-blue-700" },
  lance_dado: { label: "Lance dado", cls: "bg-amber-100 text-amber-700" },
  arrematou: { label: "Arrematou", cls: "bg-green-100 text-green-700" },
  perdeu: { label: "Perdeu", cls: "bg-red-100 text-red-700" },
  desistiu: { label: "Desistiu", cls: "bg-stone-100 text-stone-600" },
};
const STATUSES: DealStatus[] = ["acompanhando", "lance_dado", "arrematou", "perdeu", "desistiu"];

function fmt(v: number | null) {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

export function DealsClient({ initialDeals }: { initialDeals: Deal[] }) {
  const [showForm, setShowForm] = useState(false);
  const total = initialDeals.reduce((s, d) => s + (d.valor_pretendido ?? 0), 0);
  const ativos = initialDeals.filter(d => d.status === "acompanhando" || d.status === "lance_dado");

  async function changeStatus(id: string, status: string) {
    await updateDealStatus(id, status);
  }

  return (
    <>
      <PageHeader
        title="Negócios"
        subtitle={`${initialDeals.length} negociações · Pipeline: ${fmt(total)}`}
        action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> <span className="hidden sm:inline">Novo negócio</span><span className="sm:hidden">Novo</span></Button>}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Card className="p-3 text-center sm:p-5"><p className="font-display text-xl font-bold text-ink sm:text-2xl">{initialDeals.length}</p><p className="text-[11px] text-ink-soft">Total</p></Card>
        <Card className="p-3 text-center sm:p-5"><p className="font-display text-xl font-bold text-blue-600 sm:text-2xl">{ativos.length}</p><p className="text-[11px] text-ink-soft">Ativos</p></Card>
        <Card className="p-3 text-center sm:p-5"><p className="font-display text-xl font-bold text-green-600 sm:text-2xl">{initialDeals.filter(d => d.status === "arrematou").length}</p><p className="text-[11px] text-ink-soft">Arrematados</p></Card>
        <Card className="p-3 text-center sm:p-5"><p className="font-display text-xl font-bold text-ink sm:text-2xl">{fmt(total)}</p><p className="text-[11px] text-ink-soft">Pipeline</p></Card>
      </div>

      {initialDeals.length === 0 ? (
        <EmptyState title="Nenhum negócio" hint="Crie um negócio vinculando um lead a um imóvel." icon={<Handshake size={28} />} />
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {initialDeals.map(deal => {
            const s = STATUS_MAP[deal.status] ?? STATUS_MAP.acompanhando;
            return (
              <Card key={deal.id} className="p-3 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-ink">{deal.title}</h3>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {deal.contact_name}
                      {deal.property_endereco && ` · ${deal.property_endereco}`}
                      {deal.property_cidade && `, ${deal.property_cidade}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <p className="text-sm font-bold text-ink">{fmt(deal.valor_pretendido)}</p>
                    <select
                      value={deal.status}
                      onChange={e => changeStatus(deal.id, e.target.value)}
                      className={cn("rounded-full border-0 px-2.5 py-1 text-[11px] font-medium", s.cls)}
                    >
                      {STATUSES.map(st => <option key={st} value={st}>{STATUS_MAP[st].label}</option>)}
                    </select>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {showForm && <DealForm onClose={() => setShowForm(false)} />}
    </>
  );
}
