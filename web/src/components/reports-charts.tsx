"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "@/components/ui";
import type { ReportData } from "@/lib/data/reports";

const COLORS = ["#1a3c34", "#16a34a", "#c8911f", "#8b5cf6", "#dc2626", "#6b7280"];

export function ReportsCharts({ data }: { data: ReportData }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Kpi label="Atendimentos" value={data.totals.all} accent="text-brand" />
        <Kpi label="Em andamento" value={data.totals.open} accent="text-green-600" />
        <Kpi label="Em espera" value={data.totals.queued} accent="text-amber-600" />
        <Kpi label="Encerrados" value={data.totals.closed} accent="text-ink" />
      </div>

      {/* Bar chart */}
      <Card className="p-3 sm:p-5">
        <h3 className="mb-3 text-xs font-semibold text-ink sm:text-sm">Atendimentos — últimos 14 dias</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5e6e68" }} />
            <YAxis tick={{ fontSize: 10, fill: "#5e6e68" }} allowDecimals={false} width={30} />
            <Tooltip />
            <Bar dataKey="total" fill="#1a3c34" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Pie + bar side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="p-3 sm:p-5">
          <h3 className="mb-3 text-xs font-semibold text-ink sm:text-sm">Por status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                {data.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-3 sm:p-5">
          <h3 className="mb-3 text-xs font-semibold text-ink sm:text-sm">Por canal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byChannel} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "#5e6e68" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#5e6e68" }} width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {data.byDepartment.length > 0 && (
        <Card className="p-3 sm:p-5">
          <h3 className="mb-3 text-xs font-semibold text-ink sm:text-sm">Por departamento</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#5e6e68" }} />
              <YAxis tick={{ fontSize: 10, fill: "#5e6e68" }} allowDecimals={false} width={30} />
              <Tooltip />
              <Bar dataKey="value" fill="#c8911f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="p-3 sm:py-4 sm:p-5">
      <p className="text-[11px] text-ink-soft">{label}</p>
      <p className={`mt-0.5 font-display text-xl font-bold sm:text-2xl ${accent}`}>{value.toLocaleString("pt-BR")}</p>
    </Card>
  );
}
