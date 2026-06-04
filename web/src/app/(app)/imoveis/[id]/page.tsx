import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertTriangle, MapPin } from "lucide-react";
import { getProperty } from "@/lib/data/auction";
import { Card, EmptyState } from "@/components/ui";
import { PropertyActions } from "@/components/property-actions";
import { Scroll } from "@/components/scroll";

function fmt(v: number | null) {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProperty(id);

  if (!p) {
    return (
      <Scroll><div className="p-6">
        <Link href="/imoveis" className="mb-4 flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <EmptyState title="Imóvel não encontrado" />
      </div></Scroll>
    );
  }

  return (
    <Scroll>
      <div className="mx-auto max-w-4xl p-6">
        <Link href="/imoveis" className="mb-4 flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Voltar aos imóveis
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              {p.tipo_imovel} — {p.fonte} {p.tipo_leilao && `· ${p.tipo_leilao}`}
            </span>
            <h1 className="mt-1 text-2xl font-bold text-ink">{p.endereco || `${p.bairro}, ${p.cidade}`}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
              <MapPin size={14} /> {p.cidade}/{p.estado} {p.cep && `· CEP ${p.cep}`}
            </p>
          </div>
          <PropertyActions property={p} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-ink">Valores</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Avaliação</span>
                <span className="font-bold text-ink">{fmt(p.valor_avaliacao)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Lance mínimo</span>
                <span className="font-bold text-ink">{fmt(p.lance_minimo)}</span>
              </div>
              {p.desconto_pct && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">Desconto</span>
                  <span className="font-bold text-green-600">-{p.desconto_pct}%</span>
                </div>
              )}
              <hr className="border-gray-100" />
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Praça</span>
                <span className="text-ink">{p.praca || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Data do leilão</span>
                <span className="text-ink">{fmtDate(p.data_leilao)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Status</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{p.status}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-ink">Detalhes</h3>
            <div className="space-y-3">
              {p.banco && <div className="flex justify-between text-sm"><span className="text-ink-soft">Banco</span><span className="text-ink">{p.banco}</span></div>}
              {p.leiloeiro && <div className="flex justify-between text-sm"><span className="text-ink-soft">Leiloeiro</span><span className="text-ink">{p.leiloeiro}</span></div>}
              {p.area_privativa && <div className="flex justify-between text-sm"><span className="text-ink-soft">Área privativa</span><span className="text-ink">{p.area_privativa}m²</span></div>}
              {p.area_terreno && <div className="flex justify-between text-sm"><span className="text-ink-soft">Área terreno</span><span className="text-ink">{p.area_terreno}m²</span></div>}
              {p.quartos && <div className="flex justify-between text-sm"><span className="text-ink-soft">Quartos</span><span className="text-ink">{p.quartos}</span></div>}
              {p.vagas && <div className="flex justify-between text-sm"><span className="text-ink-soft">Vagas</span><span className="text-ink">{p.vagas}</span></div>}
              <hr className="border-gray-100" />
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Ocupação</span>
                <span className={p.ocupacao === "ocupado" ? "font-medium text-amber-600" : "text-ink"}>
                  {p.ocupacao === "ocupado" ? "⚠️ Ocupado" : p.ocupacao === "desocupado" ? "✅ Desocupado" : "Não informado"}
                </span>
              </div>
              <div className="flex gap-2">
                {p.aceita_financiamento && <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-600">Aceita financiamento</span>}
                {p.aceita_fgts && <span className="rounded bg-green-50 px-2 py-1 text-xs text-green-600">Aceita FGTS</span>}
              </div>
            </div>
          </Card>
        </div>

        {(p.dividas || p.notas) && (
          <Card className="mt-6">
            {p.dividas && <div className="mb-3"><h4 className="text-xs font-semibold uppercase text-ink-soft">Dívidas declaradas</h4><p className="mt-1 text-sm text-ink">{p.dividas}</p></div>}
            {p.notas && <div><h4 className="text-xs font-semibold uppercase text-ink-soft">Observações</h4><p className="mt-1 text-sm text-ink">{p.notas}</p></div>}
          </Card>
        )}

        {(p.url_original || p.edital_url) && (
          <div className="mt-4 flex gap-3">
            {p.url_original && <a href={p.url_original} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-brand hover:underline"><ExternalLink size={14} /> Ver no site do leiloeiro</a>}
            {p.edital_url && <a href={p.edital_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-brand hover:underline"><ExternalLink size={14} /> Ver edital</a>}
          </div>
        )}
      </div>
    </Scroll>
  );
}
