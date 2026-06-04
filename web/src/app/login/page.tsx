"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError("Supabase não configurado (.env.local). Login real indisponível no modo preview.");
      return;
    }
    setPending(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) setError("E-mail ou senha inválidos.");
    else router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand p-12 text-white lg:flex">
        <div className="flex items-center gap-3 animate-fade-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="" className="h-11 w-11" aria-hidden="true" />
          <h1 className="font-display text-xl font-bold tracking-tight">
            ImobLeilão <span className="text-accent">CRM</span>
          </h1>
        </div>

        <div className="animate-fade-up stagger-2">
          <blockquote className="max-w-md border-l-2 border-accent pl-5">
            <p className="text-xl font-display font-semibold leading-snug tracking-tight">
              &ldquo;Seu corretor dorme.<br />
              Seu vendedor de IA <span className="text-accent">não</span>.&rdquo;
            </p>
          </blockquote>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70">
            Agente de IA que atende no WhatsApp 24/7, qualifica leads, busca imóveis de leilão
            e calcula viabilidade — antes do seu concorrente acordar.
          </p>
        </div>

        <p className="text-xs text-white/40 animate-fade-in stagger-5">
          ImobLeilão CRM — CRM + IA para imobiliárias de leilão
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="mb-3 h-12" aria-hidden="true" />
            <h1 className="font-display text-xl font-bold text-ink">
              ImobLeilão <span className="text-accent">CRM</span>
            </h1>
          </div>

          <div className="rounded-card bg-surface p-8 shadow-lg border border-stone-200/60">
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-ink">Entrar</h2>
              <p className="text-sm text-ink-soft">Acesse o seu painel de leilões</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <AuthField name="email" type="email" label="E-mail" placeholder="voce@imobiliaria.com" autoComplete="email" />
              <AuthField name="password" type="password" label="Senha" placeholder="••••••••" autoComplete="current-password" />
              {error && <p role="alert" className="text-xs text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-ink-soft">
              Não tem conta?{" "}
              <Link href="/cadastro" className="font-medium text-accent hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-card bg-surface p-8 shadow-lg border border-stone-200/60 animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="mb-4 h-14" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          <p className="text-sm text-ink-soft">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthField({
  name,
  type,
  label,
  placeholder,
  autoComplete,
}: {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-medium text-ink-soft">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
