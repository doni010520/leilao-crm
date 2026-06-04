"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateLeadEstagio(qualificationId: string, estagio: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_qualifications")
    .update({ estagio, updated_at: new Date().toISOString() })
    .eq("id", qualificationId);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function assignLead(qualificationId: string, userId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_qualifications")
    .update({ assigned_user_id: userId, updated_at: new Date().toISOString() })
    .eq("id", qualificationId);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}
