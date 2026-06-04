import { getPipeline } from "@/lib/data/auction";
import { LeadPipeline } from "@/components/lead-pipeline";
import { Scroll } from "@/components/scroll";

export default async function PipelinePage() {
  const leads = await getPipeline();
  return (
    <Scroll>
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Pipeline de Leads</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {leads.length} leads no funil — qualificados automaticamente pelo agente de IA
            </p>
          </div>
        </header>
        <LeadPipeline leads={leads} />
      </div>
    </Scroll>
  );
}
