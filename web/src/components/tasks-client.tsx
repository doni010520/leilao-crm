"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { PageHeader, Button, Card, EmptyState } from "@/components/ui";
import { TaskForm } from "@/components/task-form";
import { toggleTask } from "@/app/(app)/tarefas/actions";
import type { Task } from "@/lib/types-auction";

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  const str = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  if (days < 0) return `⚠️ Atrasada (${str})`;
  if (days === 0) return "🔴 Hoje";
  if (days === 1) return "🟡 Amanhã";
  return `📅 ${str}`;
}

export function TasksClient({ pending, done }: { pending: Task[]; done: Task[] }) {
  const [showForm, setShowForm] = useState(false);

  async function toggle(id: string, completed: boolean) {
    await toggleTask(id, !completed);
  }

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle={`${pending.length} pendentes · ${done.length} concluídas`}
        action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Nova tarefa</Button>}
      />

      <h3 className="mb-3 text-sm font-semibold text-ink">Pendentes</h3>
      {pending.length === 0 ? (
        <EmptyState title="Nenhuma tarefa pendente" hint="Crie follow-ups para seus leads." />
      ) : (
        <div className="mb-8 space-y-2">
          {pending.map(t => (
            <Card key={t.id} className="flex items-center gap-3">
              <button onClick={() => toggle(t.id, t.completed)} className="shrink-0 text-ink-soft hover:text-green-500 transition">
                <Circle size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.description && <p className="text-xs text-ink-soft">{t.description}</p>}
              </div>
              {t.due_date && <span className="shrink-0 text-xs text-ink-soft">{fmtDate(t.due_date)}</span>}
            </Card>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-semibold text-ink-soft">Concluídas</h3>
          <div className="space-y-2 opacity-60">
            {done.map(t => (
              <Card key={t.id} className="flex items-center gap-3">
                <button onClick={() => toggle(t.id, t.completed)} className="shrink-0 text-green-500 hover:text-ink-soft transition">
                  <CheckCircle2 size={18} />
                </button>
                <p className="text-sm text-ink-soft line-through">{t.title}</p>
              </Card>
            ))}
          </div>
        </>
      )}
      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
    </>
  );
}
