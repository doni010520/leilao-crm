"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData.entries());

  const avaliacao = raw.valor_avaliacao ? Number(raw.valor_avaliacao) : null;
  const lance = raw.lance_minimo ? Number(raw.lance_minimo) : null;
  const desconto = avaliacao && lance && avaliacao > 0
    ? Math.round((1 - lance / avaliacao) * 100 * 10) / 10 : null;

  const { error } = await supabase.from("properties").insert({
    tipo_imovel: raw.tipo_imovel || null,
    endereco: raw.endereco || null,
    bairro: raw.bairro || null,
    cidade: raw.cidade,
    estado: (raw.estado as string).toUpperCase(),
    valor_avaliacao: avaliacao,
    lance_minimo: lance,
    desconto_pct: desconto,
    banco: raw.banco || null,
    leiloeiro: raw.leiloeiro || null,
    tipo_leilao: raw.tipo_leilao || "extrajudicial",
    area_privativa: raw.area_privativa ? Number(raw.area_privativa) : null,
    quartos: raw.quartos ? Number(raw.quartos) : null,
    praca: raw.praca || null,
    ocupacao: raw.ocupacao || "nao_informado",
    aceita_financiamento: raw.aceita_financiamento === "true",
    url_original: raw.url_original || null,
    notas: raw.notas || null,
    fonte: "manual",
    status: "aberto",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/imoveis");
}

export async function updatePropertyStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/imoveis");
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/imoveis");
}

export async function updateProperty(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  // Recalculate discount if values changed
  const avaliacao = data.valor_avaliacao ? Number(data.valor_avaliacao) : null;
  const lance = data.lance_minimo ? Number(data.lance_minimo) : null;
  if (avaliacao && lance && avaliacao > 0) {
    data.desconto_pct = Math.round((1 - lance / avaliacao) * 100 * 10) / 10;
  }
  data.updated_at = new Date().toISOString();
  const { error } = await supabase.from("properties").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${id}`);
}

export async function runScraper(estados: string[]) {
  const session = await getSession();
  if (!session?.profile?.organization_id) throw new Error("Não autenticado");
  const orgId = session.profile.organization_id;

  // Call the agent's scraper endpoint
  const agentUrl = process.env.AGENT_URL || "https://liriel-leilao-crm-agent.zsvt2k.easypanel.host";
  const resp = await fetch(`${agentUrl}/scraper/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estados, organization_id: orgId }),
  });
  if (!resp.ok) throw new Error("Erro ao acionar o scraper");
  const data = await resp.json();
  revalidatePath("/imoveis");
  return data;
}

export async function getScraperStatus() {
  const agentUrl = process.env.AGENT_URL || "https://liriel-leilao-crm-agent.zsvt2k.easypanel.host";
  try {
    const resp = await fetch(`${agentUrl}/scraper/status`, { cache: "no-store" });
    return await resp.json();
  } catch {
    return { status: "error", message: "Agente não disponível" };
  }
}
