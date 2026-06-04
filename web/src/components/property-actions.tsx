"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { PropertyEditForm } from "@/components/property-edit-form";
import { deleteProperty } from "@/app/(app)/imoveis/actions";
import type { Property } from "@/lib/types-auction";

export function PropertyActions({ property }: { property: Property }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este imóvel?")) return;
    setDeleting(true);
    try {
      await deleteProperty(property.id);
      router.push("/imoveis");
    } catch (e: any) {
      alert(e.message);
    }
    setDeleting(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => setEditing(true)}>
          <Pencil size={14} /> Editar
        </Button>
        <Button variant="ghost" onClick={handleDelete} disabled={deleting}>
          <Trash2 size={14} /> {deleting ? "Excluindo..." : "Excluir"}
        </Button>
      </div>
      {editing && <PropertyEditForm property={property} onClose={() => setEditing(false)} />}
    </>
  );
}
