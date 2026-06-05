import Link from "next/link";
import {
  Plus, Radio, ArrowRight, Flame, TrendingUp,
  Home, Handshake, Users, MessageSquare, Kanban,
  ClipboardList, Building, Sparkles,
} from "lucide-react";
import { getChannels } from "@/lib/data/channels";
import { getAuctionStats } from "@/lib/data/auction";
import { ChannelsList } from "@/components/channels-list";
import { Scroll } from "@/components/scroll";
import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function Stat({
  label, value, icon, accent, trend, delay,
}: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  accent: string; trend?: string; delay?: string;
}) {
  return (
    <div className={cn("animate-fade-up flex items-center gap-3 rounded-card border border-stone-200/60 bg-surface p-3 shadow-sm sm:flex-col sm:items-start sm:gap-1 sm:p-5", delay)}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11", accent)}>
        {icon}
      </div>
      <div className="flex flex-1 items-baseline justify-between sm:block sm:mt-2">
        <p className="text-xs text-ink-soft sm:order-2">{label}</p>
        <div className="flex items-center gap-2">
          <p className="font-display text-xl font-bold text-ink sm:text-2xl">{value}</p>
          {trend && (
            <span className="hidden rounded-full bg-success-bg px-1.5 py-0.5 text-[10px] font-semibold text-green-700 sm:inline">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [channels, stats] = await Promise.all([getChannels(), getAuctionStats()]);
  const connected = channels.filter((c) => c.status === "connected").length;

  return (
    <Scroll>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-col gap-4 py-6 sm:py-8 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Seu funil, imóveis e negociações.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark"
            >
              Pipeline <ArrowRight size={16} />
            </Link>
            <Link
              href="/atendimento"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              <MessageSquare size={16} /> <span className="hidden sm:inline">Atendimento</span><span className="sm:hidden">Inbox</span>
            </Link>
          </div>
        </header>

        {/* Stats — single column on mobile, multi on desktop */}
        <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Stat label="Total de Leads" value={stats.leads.total} icon={<Users size={20} />} accent="bg-brand-light text-brand" trend={`+${stats.leads.esta_semana} esta semana`} delay="stagger-1" />
          <Stat label="Leads Quentes" value={stats.leads.quentes} icon={<Flame size={20} />} accent="bg-accent-light text-accent" delay="stagger-2" />
          <Stat label="Imóveis Captados" value={stats.imoveis.total} icon={<Building size={20} />} accent="bg-brand-light text-brand" delay="stagger-3" />
          <Stat label="Taxa de Conversão" value={`${stats.leads.taxa_conversao}%`} icon={<TrendingUp size={20} />} accent="bg-success-bg text-green-700" delay="stagger-4" />
        </section>

        <section className="mt-2 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <Stat label="Negócios Ativos" value={stats.deals.em_andamento} icon={<Handshake size={20} />} accent="bg-brand-light text-brand" delay="stagger-5" />
          <Stat label="Valor no Pipeline" value={fmt(stats.deals.valor_pipeline)} icon={<TrendingUp size={20} />} accent="bg-accent-light text-accent" delay="stagger-6" />
          <Stat label="Canais Conectados" value={`${connected}/${channels.length}`} icon={<Radio size={20} />} accent="bg-success-bg text-green-700" delay="stagger-7" />
        </section>

        {/* AI Agent CTA */}
        {channels.length === 0 && (
          <Link href="/ajustes/ia" className="mt-6 block animate-fade-up stagger-5 sm:mt-8">
            <div className="flex items-center gap-4 rounded-card border-2 border-dashed border-accent/40 bg-accent-light/40 p-4 transition-all hover:border-accent sm:gap-5 sm:p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 sm:h-14 sm:w-14">
                <Sparkles size={24} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-bold text-ink sm:text-base">Configure seu Agente de IA</h3>
                <p className="mt-0.5 text-xs text-ink-soft sm:mt-1 sm:text-sm">
                  Personalize o atendimento automático no WhatsApp.
                </p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-accent" />
            </div>
          </Link>
        )}

        {/* Quick links */}
        <section className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-4 md:grid-cols-4 animate-fade-up stagger-5">
          {([
            { href: "/pipeline", label: "Pipeline", desc: "Leads qualificados", icon: Kanban },
            { href: "/imoveis", label: "Imóveis", desc: `${stats.imoveis.abertos} abertos`, icon: Home },
            { href: "/negocios", label: "Negócios", desc: `${stats.deals.total} negociações`, icon: Handshake },
            { href: "/tarefas", label: "Tarefas", desc: "Follow-ups", icon: ClipboardList },
          ] as const).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-2.5 rounded-card border border-stone-200/60 bg-surface p-3 shadow-sm transition-all sm:gap-3 sm:p-4 hover:border-accent hover:shadow-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand sm:h-10 sm:w-10">
                <link.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{link.label}</p>
                <p className="truncate text-[11px] text-ink-soft">{link.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Channels */}
        <section className="mt-6 pb-8 sm:mt-8 animate-fade-up stagger-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Canais WhatsApp</h2>
            <Link
              href="/canais"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent hover:text-accent sm:text-sm"
            >
              <Plus size={14} /> Conectar
            </Link>
          </div>
          {channels.length === 0 ? (
            <Link href="/canais" className="block">
              <EmptyState
                title="Nenhum canal conectado"
                hint="Conecte seu WhatsApp para a IA atender seus leads."
                icon={<Radio size={28} />}
              />
            </Link>
          ) : (
            <ChannelsList channels={channels} />
          )}
        </section>
      </div>
    </Scroll>
  );
}
