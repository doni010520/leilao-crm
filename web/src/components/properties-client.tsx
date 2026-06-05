"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MapPin, AlertTriangle, Search, SlidersHorizontal, X, Building, Calendar, Banknote, Home } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { PropertyForm } from "@/components/property-form";
import type { Property } from "@/lib/types-auction";

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const TIPOS = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
];
const PRACAS = [
  { value: "1ª", label: "1ª Praça" },
  { value: "2ª", label: "2ª Praça" },
];
const PRAZOS = [
  { value: "7", label: "Próximos 7 dias" },
  { value: "15", label: "Próximos 15 dias" },
  { value: "30", label: "Próximos 30 dias" },
  { value: "60", label: "Próximos 60 dias" },
];

function fmt(v: number | null) {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function PropertiesClient({ initialProperties }: { initialProperties: Property[] }) {
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [cidade, setCidade] = useState("");
  const [banco, setBanco] = useState("");
  const [ocupacao, setOcupacao] = useState("");
  const [praca, setPraca] = useState("");
  const [financiamento, setFinanciamento] = useState("");
  const [prazo, setPrazo] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [busca, setBusca] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const bancos = [...new Set(initialProperties.map(p => p.banco).filter(Boolean))].sort();
  const cidades = [...new Set(
    initialProperties
      .filter(p => !estado || p.estado === estado)
      .map(p => p.cidade)
      .filter(Boolean)
  )].sort();

  const filtered = initialProperties.filter(p => {
    if (estado && p.estado !== estado) return false;
    if (tipo && p.tipo_imovel !== tipo) return false;
    if (cidade && p.cidade !== cidade) return false;
    if (banco && p.banco !== banco) return false;
    if (ocupacao && p.ocupacao !== ocupacao) return false;
    if (praca && p.praca !== praca) return false;
    if (financiamento === "sim" && !p.aceita_financiamento) return false;
    if (financiamento === "nao" && p.aceita_financiamento) return false;
    if (prazo && daysUntil(p.data_leilao) > Number(prazo)) return false;
    if (precoMin && (p.lance_minimo ?? 0) < Number(precoMin)) return false;
    if (precoMax && (p.lance_minimo ?? Infinity) > Number(precoMax)) return false;
    if (busca) {
      const q = busca.toLowerCase();
      const haystack = [p.endereco, p.bairro, p.cidade, p.estado, p.banco, p.leiloeiro, p.tipo_imovel]
        .filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const activeFilterCount = [estado, tipo, cidade, banco, ocupacao, praca, financiamento, prazo, precoMin, precoMax].filter(Boolean).length;

  function clearFilters() {
    setEstado(""); setTipo(""); setCidade(""); setBanco(""); setOcupacao("");
    setPraca(""); setFinanciamento(""); setPrazo(""); setPrecoMin(""); setPrecoMax("");
    setBusca("");
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-soft">{filtered.length} imóvel{filtered.length !== 1 ? "is" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Cadastrar</Button>
      </div>

      {/* Search + filter toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por endereço, cidade, banco, leiloeiro..."
            className="w-full rounded-lg border border-stone-200 bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-all placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Button
          variant={showFilters ? "primary" : "ghost"}
          onClick={() => setShowFilters(v => !v)}
          className="relative"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-ink-soft hover:text-danger transition">
            <X size={14} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-6 rounded-card border border-stone-200/60 bg-surface p-5 shadow-sm animate-fade-up">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <FilterSelect
              icon={<MapPin size={14} />}
              label="Estado"
              value={estado}
              onChange={v => { setEstado(v); setCidade(""); }}
              options={UFS.map(uf => ({ value: uf, label: uf }))}
            />
            <FilterSelect
              icon={<MapPin size={14} />}
              label="Cidade"
              value={cidade}
              onChange={setCidade}
              options={cidades.map(c => ({ value: c!, label: c! }))}
              disabled={!estado && cidades.length > 50}
            />
            <FilterSelect
              icon={<Home size={14} />}
              label="Tipo"
              value={tipo}
              onChange={setTipo}
              options={TIPOS}
            />
            <FilterSelect
              icon={<Building size={14} />}
              label="Banco"
              value={banco}
              onChange={setBanco}
              options={bancos.map(b => ({ value: b!, label: b! }))}
            />
            <FilterSelect
              icon={<AlertTriangle size={14} />}
              label="Ocupação"
              value={ocupacao}
              onChange={setOcupacao}
              options={[
                { value: "desocupado", label: "Desocupado" },
                { value: "ocupado", label: "Ocupado" },
                { value: "nao_informado", label: "Não informado" },
              ]}
            />
            <FilterSelect
              label="Praça"
              value={praca}
              onChange={setPraca}
              options={PRACAS}
            />
            <FilterSelect
              icon={<Banknote size={14} />}
              label="Financiamento"
              value={financiamento}
              onChange={setFinanciamento}
              options={[
                { value: "sim", label: "Aceita" },
                { value: "nao", label: "Não aceita" },
              ]}
            />
            <FilterSelect
              icon={<Calendar size={14} />}
              label="Data do leilão"
              value={prazo}
              onChange={setPrazo}
              options={PRAZOS}
            />
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Lance mín. (R$)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={precoMin}
                  onChange={e => setPrecoMin(e.target.value)}
                  placeholder="De"
                  className="w-full rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm text-ink outline-none focus:border-brand"
                />
                <input
                  type="number"
                  value={precoMax}
                  onChange={e => setPrecoMax(e.target.value)}
                  placeholder="Até"
                  className="w-full rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm text-ink outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum imóvel encontrado"
          hint={activeFilterCount > 0 ? "Tente remover alguns filtros." : "Cadastre manualmente ou aguarde o scraping."}
          icon={<Home size={32} />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <Link key={p.id} href={`/imoveis/${p.id}`} className="block">
              <Card className="group flex flex-col transition-all duration-200 hover:border-accent hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">{p.tipo_imovel} — {p.fonte}</span>
                    <h3 className="mt-1 text-sm font-semibold text-ink">{p.endereco || `${p.bairro}, ${p.cidade}`}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {p.ocupacao === "ocupado" && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <AlertTriangle size={10} /> Ocupado
                      </span>
                    )}
                    {p.aceita_financiamento && (
                      <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Aceita financ.
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  <MapPin size={11} className="mr-1 inline" />
                  {p.cidade}/{p.estado}
                  {p.area_privativa && ` · ${p.area_privativa}m²`}
                  {p.quartos && ` · ${p.quartos}q`}
                  {p.vagas && ` · ${p.vagas}v`}
                </p>
                {p.banco && (
                  <p className="mt-1 text-xs text-ink-soft">
                    <Building size={11} className="mr-1 inline" />
                    {p.banco}
                    {p.leiloeiro && ` · ${p.leiloeiro}`}
                    {p.praca && ` · ${p.praca} praça`}
                  </p>
                )}
                <div className="mt-3 flex gap-4 border-t border-stone-100 pt-3">
                  <div>
                    <p className="text-[10px] uppercase text-ink-soft">Avaliação</p>
                    <p className="text-sm font-bold text-ink">{fmt(p.valor_avaliacao)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-ink-soft">Lance mín</p>
                    <p className="text-sm font-bold text-ink">{fmt(p.lance_minimo)}</p>
                  </div>
                  {p.desconto_pct != null && p.desconto_pct > 0 && (
                    <div>
                      <p className="text-[10px] uppercase text-ink-soft">Desconto</p>
                      <p className="text-sm font-bold text-green-600">-{p.desconto_pct}%</p>
                    </div>
                  )}
                </div>
                {p.data_leilao && (
                  <div className="mt-auto flex items-center gap-1.5 pt-2 text-[10px] text-ink-soft">
                    <Calendar size={11} />
                    Leilão: {fmtDate(p.data_leilao)}
                    {daysUntil(p.data_leilao) <= 7 && daysUntil(p.data_leilao) >= 0 && (
                      <span className="ml-1 rounded-full bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {daysUntil(p.data_leilao) === 0 ? "HOJE" : `em ${daysUntil(p.data_leilao)}d`}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
      {showForm && <PropertyForm onClose={() => setShowForm(false)} />}
    </>
  );
}

function FilterSelect({
  icon,
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
        {icon} {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm text-ink outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
      >
        <option value="">Todos</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
