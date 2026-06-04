"use client";

import { useEffect, useState } from "react";
import { X, Users, Crown, Shield, Loader2, Save, Check, Flame, TrendingUp } from "lucide-react";
import { formatPhone, cn } from "@/lib/utils";
import {
  getContactDetails,
  updateContactDetails,
  getGroupInfo,
  type ContactDetails,
  type GroupInfoResult,
} from "@/app/(app)/atendimento/actions";
import type { ConversationOverview } from "@/lib/types";

// Auction CRM fields
const CRM_FIELDS: { key: string; label: string; type?: "text" | "select"; options?: string[] }[] = [
  { key: "objetivo", label: "Objetivo", type: "select", options: ["", "morar", "investir", "revender", "alugar", "entender"] },
  { key: "regiao_interesse", label: "Região de interesse" },
  { key: "faixa_valor", label: "Faixa de valor" },
  { key: "forma_pagamento", label: "Pagamento", type: "select", options: ["", "avista", "financiamento"] },
  { key: "prazo", label: "Prazo", type: "select", options: ["", "imediato", "30dias", "60dias", "sem_prazo"] },
  { key: "email", label: "E-mail" },
];

const SCORE_CLS: Record<string, string> = {
  quente: "bg-red-100 text-red-700 border-red-200",
  morno: "bg-amber-100 text-amber-700 border-amber-200",
  curioso: "bg-blue-100 text-blue-600 border-blue-200",
};

export function ContactPanel({
  conversation,
  onClose,
  onOpenContact,
}: {
  conversation: ConversationOverview;
  onClose: () => void;
  onOpenContact: (phone: string, name?: string) => void;
}) {
  const isGroup = !!conversation.is_group;
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupInfoResult | null>(null);
  const [contact, setContact] = useState<ContactDetails | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Lead qualification data (from custom_fields or lead_qualifications)
  const leadScore = contact?.custom_fields as Record<string, unknown> | undefined;
  const scoreLabel = leadScore?.score_label as string | undefined;
  const scoreValor = leadScore?.score_valor as number | undefined;
  const perfil = leadScore?.perfil as string | undefined;
  const estagio = leadScore?.estagio as string | undefined;

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setSaved(false);
    (async () => {
      if (isGroup) {
        const g = await getGroupInfo(conversation.id);
        if (!cancel) setGroup(g);
      } else {
        const c = await getContactDetails(conversation.id);
        if (!cancel && c) {
          setContact(c);
          setName(c.name ?? "");
          setNotes(c.notes ?? "");
          const cf = (c.custom_fields ?? {}) as Record<string, unknown>;
          setFields(Object.fromEntries(CRM_FIELDS.map((f) => [f.key, String(cf[f.key] ?? "")])));
        }
      }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [conversation.id, isGroup]);

  async function save() {
    setSaving(true);
    try {
      await updateContactDetails(conversation.id, { name, notes, custom_fields: fields });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const title = conversation.contact_name ?? (isGroup ? "Grupo" : conversation.contact_phone);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-gray-100 bg-surface">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{isGroup ? "Dados do grupo" : "Dados do contato"}</h2>
        <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Header with avatar */}
        <div className="flex flex-col items-center gap-2 border-b border-gray-100 p-5 text-center">
          {conversation.contact_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conversation.contact_avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className={`flex h-20 w-20 items-center justify-center rounded-full text-xl font-semibold ${isGroup ? "bg-brand-light text-brand" : "bg-gray-200 text-gray-600"}`}>
              {isGroup ? <Users size={28} /> : title.slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="text-base font-semibold text-ink">{title}</p>
          {!isGroup && <p className="text-xs text-ink-soft">{formatPhone(conversation.contact_phone)}</p>}
        </div>

        {/* Lead qualification badge (from agent) */}
        {!isGroup && scoreLabel && (
          <div className={cn("mx-4 mt-3 rounded-lg border p-3", SCORE_CLS[scoreLabel] ?? "bg-gray-50")}>
            <div className="flex items-center gap-2">
              <Flame size={16} />
              <span className="text-sm font-semibold">
                Score {scoreValor} — {scoreLabel}
              </span>
            </div>
            <div className="mt-1 flex gap-2 text-xs">
              {perfil && <span className="rounded bg-white/60 px-1.5 py-0.5">{perfil.replace(/_/g, " ")}</span>}
              {estagio && <span className="rounded bg-white/60 px-1.5 py-0.5">{estagio.replace(/_/g, " ")}</span>}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Carregando...
          </div>
        )}

        {/* GROUP */}
        {!loading && isGroup && group && (
          <div className="p-4">
            {group.description && (
              <>
                <p className="mb-1 text-[11px] font-semibold uppercase text-ink-soft">Descrição</p>
                <p className="mb-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-ink-soft">{group.description}</p>
              </>
            )}
            <p className="mb-2 text-[11px] font-semibold uppercase text-ink-soft">{group.participants.length} participantes</p>
            <div className="space-y-1">
              {group.participants.map((p) => (
                <button key={p.phone} onClick={() => onOpenContact(p.phone, p.name ?? undefined)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">{(p.name ?? p.phone).slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-ink">{p.name ?? formatPhone(p.phone)}</span>{p.name && <span className="block truncate text-xs text-ink-soft">{formatPhone(p.phone)}</span>}</span>
                  {p.isOwner ? <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600"><Crown size={12} /> Dono</span> : p.isAdmin ? <span className="flex items-center gap-1 text-[10px] font-medium text-brand"><Shield size={12} /> Admin</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTACT: auction CRM form */}
        {!loading && !isGroup && contact && (
          <div className="space-y-3 p-4">
            <Field label="Nome">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            {CRM_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.type === "select" ? (
                  <select value={fields[f.key] ?? ""} onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))} className={inputCls}>
                    {f.options!.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
                  </select>
                ) : (
                  <input value={fields[f.key] ?? ""} onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))} className={inputCls} />
                )}
              </Field>
            ))}
            <Field label="Observações">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
            </Field>
            <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? "Salvo!" : "Salvar"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

const inputCls = "w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
