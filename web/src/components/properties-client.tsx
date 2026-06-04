"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MapPin, ExternalLink, AlertTriangle } from "lucide-react";
import { PageHeader, Button, Card, EmptyState } from "@/components/ui";
import { PropertyForm } from "@/components/property-form";
import type { Property } from "@/lib/types-auction";

const UFS = ["SP","RJ","MG","PR","RS","BA","PE","CE","DF","GO","SC","PA","MA","AM","ES"];
const TIPOS = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
];

function fmt(v: number | null) {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PropertiesClient({ initialProperties }: { initialProperties: Property[] }) {
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filtered = initialProperties.filter(p => {
    if (estado && p.estado !== estado) return false;
    if (tipo && p.tipo_imovel !== tipo) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Imóveis de Leilão"
        subtitle={`${filtered.length} imóveis com leilão aberto`}
        action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Cadastrar</Button>}
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <select value={estado} onChange={e => setEstado(e.target.value)} className="rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm text-ink">
          <option value="">Todos os estados</option>
          {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
        <select value={tipo} onChange={e => setTipo(e.target.value)} className="rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm text-ink">
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum imóvel" hint="Cadastre manualmente ou aguarde o scraping." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <Link key={p.id} href={`/imoveis/${p.id}`} className="block">
              <Card className="flex flex-col transition hover:border-brand hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">{p.tipo_imovel} — {p.fonte}</span>
                    <h3 className="mt-1 text-sm font-semibold text-ink">{p.endereco || `${p.bairro}, ${p.cidade}`}</h3>
                  </div>
                  {p.ocupacao === "ocupado" && <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700"><AlertTriangle size={10} /> Ocupado</span>}
                </div>
                <p className="mt-1 text-xs text-ink-soft"><MapPin size={11} className="mr-1 inline" />{p.cidade}/{p.estado}{p.area_privativa && ` · ${p.area_privativa}m²`}{p.quartos && ` · ${p.quartos}q`}</p>
                {p.banco && <p className="mt-1 text-xs text-ink-soft">🏦 {p.banco} {p.praca && `· ${p.praca} praça`}</p>}
                <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3">
                  <div><p className="text-[10px] uppercase text-ink-soft">Avaliação</p><p className="text-sm font-bold text-ink">{fmt(p.valor_avaliacao)}</p></div>
                  <div><p className="text-[10px] uppercase text-ink-soft">Lance mín</p><p className="text-sm font-bold text-ink">{fmt(p.lance_minimo)}</p></div>
                  {p.desconto_pct && p.desconto_pct > 0 && <div><p className="text-[10px] uppercase text-ink-soft">Desconto</p><p className="text-sm font-bold text-green-600">-{p.desconto_pct}%</p></div>}
                </div>
                {p.data_leilao && <div className="mt-auto pt-2 text-[10px] text-ink-soft">📅 Leilão: {fmtDate(p.data_leilao)}</div>}
              </Card>
            </Link>
          ))}
        </div>
      )}
      {showForm && <PropertyForm onClose={() => setShowForm(false)} />}
    </>
  );
}
