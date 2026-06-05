"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { createDeal } from "@/app/(app)/negocios/actions";

export function DealForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    try {
      await createDeal(formData);
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao criar negócio");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-surface p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Novo Negócio</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={20} /></button>
        </div>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Título *</label>
            <input name="title" required placeholder="Ex: Apto Consolação — Carlos" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">ID do Contato *</label>
            <input name="contact_id" required placeholder="UUID do contato" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm font-mono text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">ID do Imóvel</label>
            <input name="property_id" placeholder="UUID do imóvel (opcional)" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm font-mono text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Valor pretendido (R$)</label>
              <input name="valor_pretendido" type="number" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Data do leilão</label>
              <input name="data_leilao" type="datetime-local" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Notas</label>
            <textarea name="notas" rows={2} className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Criando..." : "Criar Negócio"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
