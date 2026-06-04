"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const raw = Object.fromEntries(formData.entries());
  const { error } = await supabase.from("tasks").insert({
    contact_id: raw.contact_id || null,
    deal_id: raw.deal_id || null,
    title: raw.title,
    description: raw.description || null,
    due_date: raw.due_date || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function toggleTask(id: string, completed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}
