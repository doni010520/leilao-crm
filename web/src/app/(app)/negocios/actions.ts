"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDeal(formData: FormData) {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData.entries());

  const { error } = await supabase.from("deals").insert({
    contact_id: raw.contact_id,
    property_id: raw.property_id || null,
    title: raw.title,
    valor_pretendido: raw.valor_pretendido ? Number(raw.valor_pretendido) : null,
    data_leilao: raw.data_leilao || null,
    notas: raw.notas || null,
    status: "acompanhando",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/negocios");
}

export async function updateDealStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("deals").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/negocios");
}
