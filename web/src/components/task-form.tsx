"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { createTask } from "@/app/(app)/tarefas/actions";

export function TaskForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    try {
      await createTask(formData);
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao criar tarefa");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-surface p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Nova Tarefa</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={20} /></button>
        </div>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Título *</label>
            <input name="title" required placeholder="Ex: Ligar para confirmar participação" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Descrição</label>
            <textarea name="description" rows={2} placeholder="Detalhes opcionais" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Prazo</label>
            <input name="due_date" type="datetime-local" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Contato (opcional)</label>
              <input name="contact_id" placeholder="UUID" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm font-mono text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase text-ink-soft">Negócio (opcional)</label>
              <input name="deal_id" placeholder="UUID" className="w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm font-mono text-xs" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Criando..." : "Criar Tarefa"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
