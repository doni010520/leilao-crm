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
import { StatCard, EmptyState } from "@/components/ui";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

export default async function DashboardPage() {
  const [channels, stats] = await Promise.all([getChannels(), getAuctionStats()]);
  const connected = channels.filter((c) => c.status === "connected").length;

  return (
    <Scroll>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Dashboard de Leilões
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Acompanhe seu funil, imóveis captados e negociações.
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
              <MessageSquare size={16} /> Atendimento
            </Link>
          </div>
        </header>

        {/* Stats row 1: Leads */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="animate-fade-up stagger-1">
            <StatCard
              label="Total de Leads"
              value={stats.leads.total}
              trend={`+${stats.leads.esta_semana} esta semana`}
              icon={<Users size={20} />}
              accent="bg-brand-light text-brand"
            />
          </div>
          <div className="animate-fade-up stagger-2">
            <StatCard
              label="Leads Quentes"
              value={stats.leads.quentes}
              icon={<Flame size={20} />}
              accent="bg-accent-light text-accent"
            />
          </div>
          <div className="animate-fade-up stagger-3">
            <StatCard
              label="Imóveis Captados"
              value={stats.imoveis.total}
              icon={<Building size={20} />}
              accent="bg-brand-light text-brand"
            />
          </div>
          <div className="animate-fade-up stagger-4">
            <StatCard
              label="Taxa de Conversão"
              value={`${stats.leads.taxa_conversao}%`}
              icon={<TrendingUp size={20} />}
              accent="bg-success-bg text-green-700"
            />
          </div>
        </section>

        {/* Stats row 2: Deals */}
        <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="animate-fade-up stagger-5">
            <StatCard
              label="Negócios Ativos"
              value={stats.deals.em_andamento}
              icon={<Handshake size={20} />}
              accent="bg-brand-light text-brand"
            />
          </div>
          <div className="animate-fade-up stagger-6">
            <StatCard
              label="Pipeline"
              value={fmt(stats.deals.valor_pipeline)}
              icon={<TrendingUp size={20} />}
              accent="bg-accent-light text-accent"
            />
          </div>
          <div className="animate-fade-up stagger-7">
            <StatCard
              label="Canais Conectados"
              value={`${connected}/${channels.length}`}
              icon={<Radio size={20} />}
              accent="bg-success-bg text-green-700"
            />
          </div>
        </section>

        {/* AI Agent CTA */}
        {channels.length === 0 && (
          <Link href="/ajustes/ia" className="mt-8 block animate-fade-up stagger-5">
            <div className="flex items-center gap-5 rounded-card border-2 border-dashed border-accent/40 bg-accent-light/40 p-6 transition-all hover:border-accent hover:bg-accent-light/60">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Sparkles size={28} className="text-accent" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-ink">Configure seu Agente de IA</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  Personalize o assistente que vai atender seus clientes no WhatsApp 24/7, qualificar leads e transferir os quentes pra você.
                </p>
              </div>
              <ArrowRight size={20} className="shrink-0 text-accent" />
            </div>
          </Link>
        )}

        {/* Quick links */}
        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-up stagger-5">
          {([
            { href: "/pipeline", label: "Ver Pipeline", desc: "Leads qualificados", icon: Kanban },
            { href: "/imoveis", label: "Ver Imóveis", desc: `${stats.imoveis.abertos} abertos`, icon: Home },
            { href: "/negocios", label: "Ver Negócios", desc: `${stats.deals.total} negociações`, icon: Handshake },
            { href: "/tarefas", label: "Ver Tarefas", desc: "Follow-ups pendentes", icon: ClipboardList },
          ] as const).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-card border border-stone-200/60 bg-surface p-4 shadow-sm transition-all duration-200 hover:border-accent hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-accent-light group-hover:text-accent">
                <link.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{link.label}</p>
                <p className="text-xs text-ink-soft">{link.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Channels */}
        <section className="mt-8 pb-8 animate-fade-up stagger-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Canais WhatsApp</h2>
            <Link
              href="/canais"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            >
              <Plus size={15} /> Conectar canal
            </Link>
          </div>
          {channels.length === 0 ? (
            <Link href="/canais" className="block">
              <EmptyState
                title="Nenhum canal conectado"
                hint="Conecte um número de WhatsApp para o agente de IA começar a atender."
                icon={<Radio size={32} />}
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
