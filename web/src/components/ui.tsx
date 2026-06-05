import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 animate-fade-up sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:py-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-ink-soft sm:mt-1 sm:text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-card border border-stone-200/60 bg-surface p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = "bg-brand-light text-brand",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  trend?: string;
  accent?: string;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-card border border-stone-200/60 bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105", accent)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold leading-tight text-ink">{value}</p>
        <div className="flex items-center gap-2">
          <p className="truncate text-xs text-ink-soft">{label}</p>
          {trend && (
            <span className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              trend.startsWith("+") || trend.startsWith("▲")
                ? "bg-success-bg text-green-700"
                : "bg-red-50 text-red-600"
            )}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "accent";
}) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    accent: "bg-accent text-white hover:bg-amber-700 shadow-sm",
    ghost: "bg-stone-100 text-ink hover:bg-stone-200",
    danger: "bg-danger text-white hover:bg-red-700",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    connected: { label: "Conectado", cls: "bg-success-bg text-green-700" },
    connecting: { label: "Conectando", cls: "bg-amber-100 text-amber-700" },
    pending: { label: "Pendente", cls: "bg-stone-100 text-stone-600" },
    disconnected: { label: "Desconectado", cls: "bg-red-100 text-red-700" },
    error: { label: "Erro", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "connected" ? "animate-pulse bg-green-500" : "bg-current")} />
      {s.label}
    </span>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-stone-300 bg-surface/50 py-16 text-center animate-fade-in">
      {icon && <div className="mb-3 text-ink-soft">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}
