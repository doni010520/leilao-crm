import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE } from "@/lib/mock";
import {
  MOCK_PROPERTIES, MOCK_PIPELINE, MOCK_DEALS,
  MOCK_ACTIVITIES, MOCK_TASKS, MOCK_AUCTION_STATS,
} from "@/lib/mock-auction";
import type { Property, PipelineOverview, Deal, Activity, Task } from "@/lib/types-auction";

// ─── Properties ──────────────────────────────────────────────────────────────

export async function getProperties(filters?: {
  estado?: string; tipo_imovel?: string; status?: string;
}): Promise<Property[]> {
  if (PREVIEW_MODE) {
    let items = MOCK_PROPERTIES;
    if (filters?.estado) items = items.filter(p => p.estado === filters.estado);
    if (filters?.tipo_imovel) items = items.filter(p => p.tipo_imovel === filters.tipo_imovel);
    if (filters?.status) items = items.filter(p => p.status === filters.status);
    return items;
  }
  noStore();
  const supabase = await createClient();
  let query = supabase.from("properties").select("*").order("created_at", { ascending: false });
  if (filters?.estado) query = query.eq("estado", filters.estado);
  if (filters?.tipo_imovel) query = query.eq("tipo_imovel", filters.tipo_imovel);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data } = await query.limit(100);
  return (data as Property[]) ?? [];
}

export async function getProperty(id: string): Promise<Property | null> {
  if (PREVIEW_MODE) return MOCK_PROPERTIES.find(p => p.id === id) ?? null;
  noStore();
  const supabase = await createClient();
  const { data } = await supabase.from("properties").select("*").eq("id", id).single();
  return data as Property | null;
}

// ─── Pipeline (leads) ────────────────────────────────────────────────────────

export async function getPipeline(): Promise<PipelineOverview[]> {
  if (PREVIEW_MODE) return MOCK_PIPELINE;
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("pipeline_overview")
    .select("*")
    .order("updated_at", { ascending: false });
  return (data as PipelineOverview[]) ?? [];
}

export async function getLeadByContact(contactId: string): Promise<PipelineOverview | null> {
  if (PREVIEW_MODE) return MOCK_PIPELINE.find(l => l.contact_id === contactId) ?? null;
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("pipeline_overview")
    .select("*")
    .eq("contact_id", contactId)
    .single();
  return data as PipelineOverview | null;
}

// ─── Deals ───────────────────────────────────────────────────────────────────

export async function getDeals(status?: string): Promise<Deal[]> {
  if (PREVIEW_MODE) {
    return status ? MOCK_DEALS.filter(d => d.status === status) : MOCK_DEALS;
  }
  noStore();
  const supabase = await createClient();
  let query = supabase.from("deals").select("*, contacts(name), properties(cidade, endereco)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data as Deal[]) ?? [];
}

// ─── Activities ──────────────────────────────────────────────────────────────

export async function getActivities(contactId: string): Promise<Activity[]> {
  if (PREVIEW_MODE) return MOCK_ACTIVITIES.filter(a => a.contact_id === contactId);
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Activity[]) ?? [];
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(filters?: {
  completed?: boolean; contactId?: string;
}): Promise<Task[]> {
  if (PREVIEW_MODE) {
    let items = MOCK_TASKS;
    if (filters?.completed !== undefined) items = items.filter(t => t.completed === filters.completed);
    if (filters?.contactId) items = items.filter(t => t.contact_id === filters.contactId);
    return items;
  }
  noStore();
  const supabase = await createClient();
  let query = supabase.from("tasks").select("*").order("due_date", { ascending: true });
  if (filters?.completed !== undefined) query = query.eq("completed", filters.completed);
  if (filters?.contactId) query = query.eq("contact_id", filters.contactId);
  const { data } = await query.limit(50);
  return (data as Task[]) ?? [];
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getAuctionStats() {
  if (PREVIEW_MODE) return MOCK_AUCTION_STATS;
  noStore();
  const supabase = await createClient();

  const [leads, props, deals] = await Promise.all([
    supabase.from("lead_qualifications").select("score_label, estagio", { count: "exact" }),
    supabase.from("properties").select("status", { count: "exact" }),
    supabase.from("deals").select("status, valor_pretendido"),
  ]);

  const allLeads = leads.data ?? [];
  const allProps = props.data ?? [];
  const allDeals = deals.data ?? [];

  return {
    leads: {
      total: allLeads.length,
      quentes: allLeads.filter(l => l.score_label === "quente").length,
      mornos: allLeads.filter(l => l.score_label === "morno").length,
      curiosos: allLeads.filter(l => l.score_label === "curioso").length,
      esta_semana: 0, // TODO: filter by date
      taxa_conversao: allLeads.length > 0
        ? Math.round(allLeads.filter(l => l.estagio === "convertido" || l.estagio === "em_negociacao").length / allLeads.length * 100)
        : 0,
    },
    imoveis: {
      total: allProps.length,
      abertos: allProps.filter(p => p.status === "aberto").length,
    },
    deals: {
      total: allDeals.length,
      em_andamento: allDeals.filter(d => d.status === "acompanhando" || d.status === "lance_dado").length,
      valor_pipeline: allDeals.reduce((sum, d) => sum + (d.valor_pretendido || 0), 0),
    },
    atendimento: { mensagens_hoje: 0, total_conversas: 0 },
  };
}
