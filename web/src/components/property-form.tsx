"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { createProperty } from "@/app/(app)/imoveis/actions";

const UFS = ["SP","RJ","MG","PR","RS","BA","PE","CE","DF","GO","SC","PA","MA","AM","ES","PB","PI","RN","SE","AL","MT","MS","RO","TO","AC","AP","RR"];

export function PropertyForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    try {
      await createProperty(formData);
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao cadastrar");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Cadastrar Imóvel</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={20} /></button>
        </div>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Tipo</label>
              <select name="tipo_imovel" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" defaultValue="apartamento">
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="terreno">Terreno</option>
                <option value="comercial">Comercial</option>
                <option value="rural">Rural</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Estado *</label>
              <select name="estado" required className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" defaultValue="SP">
                {UFS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Cidade *</label>
              <input name="cidade" required className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Bairro</label>
              <input name="bairro" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Endereço</label>
            <input name="endereco" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Valor avaliação (R$)</label>
              <input name="valor_avaliacao" type="number" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Lance mínimo (R$)</label>
              <input name="lance_minimo" type="number" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Banco</label>
              <input name="banco" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" placeholder="Ex: Caixa" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Leiloeiro</label>
              <input name="leiloeiro" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" placeholder="Ex: Superbid" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Área (m²)</label>
              <input name="area_privativa" type="number" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Quartos</label>
              <input name="quartos" type="number" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Praça</label>
              <select name="praca" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm">
                <option value="1a">1ª Praça</option>
                <option value="2a">2ª Praça</option>
                <option value="venda_direta">Venda Direta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Ocupação</label>
              <select name="ocupacao" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm">
                <option value="desocupado">Desocupado</option>
                <option value="ocupado">Ocupado</option>
                <option value="nao_informado">Não informado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Tipo leilão</label>
              <select name="tipo_leilao" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm">
                <option value="extrajudicial">Extrajudicial</option>
                <option value="judicial">Judicial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Link original</label>
            <input name="url_original" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" placeholder="https://..." />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Observações</label>
            <textarea name="notas" rows={2} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
