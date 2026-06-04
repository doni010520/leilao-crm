import Link from "next/link";
import {
  Plus, Radio, ArrowRight, Flame, TrendingUp,
  Home, Handshake, Users, MessageSquare, Clock,
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
        <header className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Dashboard de Leilões 🏛️</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Acompanhe seu funil, imóveis captados e negociações.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              Pipeline <ArrowRight size={16} />
            </Link>
            <Link
              href="/atendimento"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              <MessageSquare size={16} /> Atendimento
            </Link>
          </div>
        </header>

        {/* Stats row 1: Leads */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total de Leads"
            value={stats.leads.total}
            icon={<Users size={20} />}
            accent="bg-brand-light text-brand"
          />
          <StatCard
            label="Leads Quentes"
            value={stats.leads.quentes}
            icon={<Flame size={20} />}
            accent="bg-red-100 text-red-600"
          />
          <StatCard
            label="Imóveis Captados"
            value={stats.imoveis.total}
            icon={<Home size={20} />}
            accent="bg-violet-100 text-violet-600"
          />
          <StatCard
            label="Taxa de Conversão"
            value={`${stats.leads.taxa_conversao}%`}
            icon={<TrendingUp size={20} />}
            accent="bg-green-100 text-green-600"
          />
        </section>

        {/* Stats row 2: Deals */}
        <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            label="Negócios Ativos"
            value={stats.deals.em_andamento}
            icon={<Handshake size={20} />}
            accent="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Pipeline"
            value={fmt(stats.deals.valor_pipeline)}
            icon={<TrendingUp size={20} />}
            accent="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Canais Conectados"
            value={`${connected}/${channels.length}`}
            icon={<Radio size={20} />}
            accent="bg-green-100 text-green-600"
          />
        </section>

        {/* Quick links */}
        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { href: "/pipeline", label: "Ver Pipeline", desc: "Leads qualificados", icon: "📊" },
            { href: "/imoveis", label: "Ver Imóveis", desc: `${stats.imoveis.abertos} abertos`, icon: "🏠" },
            { href: "/negocios", label: "Ver Negócios", desc: `${stats.deals.total} negociações`, icon: "🤝" },
            { href: "/tarefas", label: "Ver Tarefas", desc: "Follow-ups pendentes", icon: "📋" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-card border border-gray-100 bg-surface p-4 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <span className="text-2xl">{link.icon}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{link.label}</p>
                <p className="text-xs text-ink-soft">{link.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Channels */}
        <section className="mt-8 pb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Canais WhatsApp</h2>
            <Link
              href="/canais"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
            >
              <Plus size={15} /> Conectar canal
            </Link>
          </div>
          {channels.length === 0 ? (
            <Link href="/canais" className="block">
              <EmptyState
                title="Nenhum canal conectado"
                hint="Conecte um número de WhatsApp para o agente de IA começar a atender."
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
