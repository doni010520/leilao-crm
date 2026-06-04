import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLeadByContact, getActivities, getDeals, getTasks } from "@/lib/data/auction";
import { LeadDetail } from "@/components/lead-detail";
import { Scroll } from "@/components/scroll";

export default async function LeadDetailPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const [lead, activities, deals, tasks] = await Promise.all([
    getLeadByContact(contactId),
    getActivities(contactId),
    getDeals(),
    getTasks({ contactId }),
  ]);

  if (!lead) {
    return (
      <Scroll>
        <div className="p-6">
          <Link href="/pipeline" className="mb-4 flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={16} /> Voltar ao pipeline
          </Link>
          <p className="text-ink-soft">Lead não encontrado.</p>
        </div>
      </Scroll>
    );
  }

  const contactDeals = deals.filter(d => d.contact_id === contactId);

  return (
    <Scroll>
      <div className="mx-auto max-w-5xl p-6">
        <Link href="/pipeline" className="mb-4 flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Voltar ao pipeline
        </Link>
        <LeadDetail lead={lead} activities={activities} deals={contactDeals} tasks={tasks} />
      </div>
    </Scroll>
  );
}
