"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { updateProperty } from "@/app/(app)/imoveis/actions";
import type { Property } from "@/lib/types-auction";

const UFS = ["SP","RJ","MG","PR","RS","BA","PE","CE","DF","GO","SC","PA","MA","AM","ES","PB","PI","RN","SE","AL","MT","MS","RO","TO","AC","AP","RR"];

export function PropertyEditForm({ property, onClose }: { property: Property; onClose: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    tipo_imovel: property.tipo_imovel ?? "apartamento",
    estado: property.estado ?? "SP",
    cidade: property.cidade ?? "",
    bairro: property.bairro ?? "",
    endereco: property.endereco ?? "",
    valor_avaliacao: property.valor_avaliacao?.toString() ?? "",
    lance_minimo: property.lance_minimo?.toString() ?? "",
    banco: property.banco ?? "",
    leiloeiro: property.leiloeiro ?? "",
    area_privativa: property.area_privativa?.toString() ?? "",
    quartos: property.quartos?.toString() ?? "",
    praca: property.praca ?? "2a",
    ocupacao: property.ocupacao ?? "nao_informado",
    tipo_leilao: property.tipo_leilao ?? "extrajudicial",
    aceita_financiamento: property.aceita_financiamento ?? false,
    url_original: property.url_original ?? "",
    notas: property.notas ?? "",
    status: property.status ?? "aberto",
  });

  const set = (k: string, v: string | boolean) => setF(prev => ({ ...prev, [k]: v }));

  async function handleSubmit() {
    if (!f.cidade || !f.estado) { setError("Cidade e estado obrigatórios"); return; }
    setError("");
    setLoading(true);
    try {
      const data: Record<string, unknown> = { ...f };
      if (data.valor_avaliacao) data.valor_avaliacao = parseFloat(data.valor_avaliacao as string);
      else delete data.valor_avaliacao;
      if (data.lance_minimo) data.lance_minimo = parseFloat(data.lance_minimo as string);
      else delete data.lance_minimo;
      if (data.area_privativa) data.area_privativa = parseFloat(data.area_privativa as string);
      else delete data.area_privativa;
      if (data.quartos) data.quartos = parseInt(data.quartos as string);
      else delete data.quartos;
      data.estado = (data.estado as string).toUpperCase();
      Object.keys(data).forEach(k => { if (data[k] === "") delete data[k]; });
      await updateProperty(property.id, data);
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao salvar");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-surface p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Editar Imóvel</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={20} /></button>
        </div>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Tipo</label>
              <select value={f.tipo_imovel} onChange={e => set("tipo_imovel", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm">
                <option value="apartamento">Apartamento</option><option value="casa">Casa</option><option value="terreno">Terreno</option><option value="comercial">Comercial</option><option value="rural">Rural</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Estado *</label>
              <select value={f.estado} onChange={e => set("estado", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm">
                {UFS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Cidade *</label><input value={f.cidade} onChange={e => set("cidade", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Bairro</label><input value={f.bairro} onChange={e => set("bairro", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Endereço</label><input value={f.endereco} onChange={e => set("endereco", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Valor avaliação (R$)</label><input type="number" value={f.valor_avaliacao} onChange={e => set("valor_avaliacao", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Lance mínimo (R$)</label><input type="number" value={f.lance_minimo} onChange={e => set("lance_minimo", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Banco</label><input value={f.banco} onChange={e => set("banco", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Leiloeiro</label><input value={f.leiloeiro} onChange={e => set("leiloeiro", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Área (m²)</label><input type="number" value={f.area_privativa} onChange={e => set("area_privativa", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Quartos</label><input type="number" value={f.quartos} onChange={e => set("quartos", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Praça</label><select value={f.praca} onChange={e => set("praca", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm"><option value="1a">1ª Praça</option><option value="2a">2ª Praça</option><option value="venda_direta">Venda Direta</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Ocupação</label><select value={f.ocupacao} onChange={e => set("ocupacao", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm"><option value="desocupado">Desocupado</option><option value="ocupado">Ocupado</option><option value="nao_informado">Não informado</option></select></div>
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Tipo leilão</label><select value={f.tipo_leilao} onChange={e => set("tipo_leilao", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm"><option value="extrajudicial">Extrajudicial</option><option value="judicial">Judicial</option></select></div>
            <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Status</label><select value={f.status} onChange={e => set("status", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm"><option value="aberto">Aberto</option><option value="arrematado">Arrematado</option><option value="suspenso">Suspenso</option><option value="frustrado">Frustrado</option><option value="encerrado">Encerrado</option></select></div>
          </div>
          <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Link original</label><input value={f.url_original} onChange={e => set("url_original", e.target.value)} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Observações</label><textarea value={f.notas} onChange={e => set("notas", e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
