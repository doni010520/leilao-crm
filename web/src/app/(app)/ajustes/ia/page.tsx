"use client";

import { useState } from "react";
import { Bot, Save, MessageSquare, Users, MapPin, Clock, Shield, Zap, ChevronDown, ChevronUp, Info } from "lucide-react";
import { PageHeader, Button, Card } from "@/components/ui";
import { Scroll } from "@/components/scroll";

interface AgentConfig {
  nomeImobiliaria: string;
  nomeCorretor: string;
  creci: string;
  whatsappCorretor: string;
  regioes: string;
  especialidades: string;
  tom: "profissional" | "descontraido" | "formal";
  saudacao: string;
  mensagemAusencia: string;
  horarioAtendimento: string;
  scoreHandoff: number;
  apresentacao: string;
  diferencial: string;
  frasesProibidas: string;
  encerramento: string;
}

const DEFAULT_CONFIG: AgentConfig = {
  nomeImobiliaria: "",
  nomeCorretor: "",
  creci: "",
  whatsappCorretor: "",
  regioes: "",
  especialidades: "Leilões extrajudiciais, imóveis Caixa, leilões judiciais",
  tom: "profissional",
  saudacao: "Olá! 👋 Sou o assistente virtual da {imobiliária}. Posso te ajudar a encontrar oportunidades em leilões de imóveis. Você já participou de algum leilão antes?",
  mensagemAusencia: "Estamos fora do horário de atendimento humano, mas posso continuar te ajudando! Se precisar falar com o corretor, ele retorna no próximo horário comercial.",
  horarioAtendimento: "Seg a Sex, 8h às 18h",
  scoreHandoff: 12,
  apresentacao: "Somos especialistas em leilões de imóveis. Ajudamos você a encontrar oportunidades com até 60% de desconto, analisamos editais e acompanhamos todo o processo.",
  diferencial: "",
  frasesProibidas: "",
  encerramento: "Foi um prazer te ajudar! Qualquer dúvida sobre leilões, pode mandar mensagem a qualquer hora. 🏠",
};

const TONS = [
  { value: "profissional", label: "Profissional", desc: "Direto, claro e confiável. Ideal para investidores." },
  { value: "descontraido", label: "Descontraído", desc: "Leve e amigável. Bom para quem compra a primeira casa." },
  { value: "formal", label: "Formal", desc: "Respeitoso e técnico. Para clientes corporativos." },
] as const;

export default function AgentConfigPage() {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identidade: true,
    comportamento: true,
    mensagens: false,
    handoff: false,
    avancado: false,
  });

  function toggle(section: string) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  function update<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Scroll>
      <div className="mx-auto max-w-3xl pb-12">
        <PageHeader
          title="Agente de IA"
          subtitle="Configure o assistente que atende seus clientes no WhatsApp 24/7"
          action={
            <Button onClick={handleSave} variant={saved ? "ghost" : "primary"}>
              <Save size={16} />
              {saved ? "Salvo!" : "Salvar configuração"}
            </Button>
          }
        />

        {/* Hero explanation */}
        <Card className="mb-8 border-accent/30 bg-accent-light/50">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Bot size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink">Como funciona seu agente de IA</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Quando um cliente manda mensagem no WhatsApp, o agente responde automaticamente.
                Ele <strong>acolhe</strong>, <strong>tira dúvidas sobre leilão</strong>, <strong>qualifica o lead</strong> (descobre se é comprador sério
                ou curioso) e <strong>transfere pra você</strong> só os leads quentes — com resumo completo. Você
                personaliza abaixo o que ele diz e como se comporta.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Section: Identidade ── */}
        <Section
          title="Identidade da Imobiliária"
          icon={<Users size={18} />}
          description="A IA se apresenta com esses dados"
          open={openSections.identidade}
          onToggle={() => toggle("identidade")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nome da imobiliária"
              hint="Como a IA se apresenta: 'Sou o assistente da...'"
              value={config.nomeImobiliaria}
              onChange={v => update("nomeImobiliaria", v)}
              placeholder="Ex.: Imob Leilões SP"
            />
            <Field
              label="Seu nome (corretor)"
              hint="Pra quem a IA transfere: 'Vou te conectar com...'"
              value={config.nomeCorretor}
              onChange={v => update("nomeCorretor", v)}
              placeholder="Ex.: Adonias"
            />
            <Field
              label="CRECI"
              hint="Mostrado se o cliente perguntar"
              value={config.creci}
              onChange={v => update("creci", v)}
              placeholder="Ex.: 123456-F/SP"
            />
            <Field
              label="WhatsApp do corretor"
              hint="Número para onde a IA transfere leads quentes"
              value={config.whatsappCorretor}
              onChange={v => update("whatsappCorretor", v)}
              placeholder="5511999999999"
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Regiões de atuação"
              hint="Onde você busca imóveis"
              value={config.regioes}
              onChange={v => update("regioes", v)}
              placeholder="Ex.: São Paulo capital, ABC, Campinas"
            />
            <Field
              label="Especialidades"
              hint="Tipos de leilão que você trabalha"
              value={config.especialidades}
              onChange={v => update("especialidades", v)}
              placeholder="Ex.: Leilões Caixa, extrajudiciais"
            />
          </div>
          <TextArea
            label="Apresentação da empresa"
            hint="Texto curto que a IA usa quando o cliente pergunta 'quem é vocês?'"
            value={config.apresentacao}
            onChange={v => update("apresentacao", v)}
            rows={3}
            className="mt-4"
          />
          <Field
            label="Diferencial"
            hint="O que te diferencia dos concorrentes. A IA menciona quando faz sentido."
            value={config.diferencial}
            onChange={v => update("diferencial", v)}
            placeholder="Ex.: Acompanhamento jurídico incluso, 10 anos de experiência"
            className="mt-4"
          />
        </Section>

        {/* ── Section: Comportamento ── */}
        <Section
          title="Comportamento da IA"
          icon={<MessageSquare size={18} />}
          description="Como a IA conversa com seus clientes"
          open={openSections.comportamento}
          onToggle={() => toggle("comportamento")}
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Tom de voz</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => update("tom", t.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    config.tom === t.value
                      ? "border-brand bg-brand-light shadow-sm"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{t.label}</p>
                  <p className="mt-1 text-xs text-ink-soft">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
              <Clock size={15} className="text-ink-soft" /> Horário de atendimento humano
            </label>
            <p className="mb-2 text-xs text-ink-soft">Fora deste horário a IA continua atendendo, mas avisa que o corretor retorna no próximo dia útil.</p>
            <input
              type="text"
              value={config.horarioAtendimento}
              onChange={e => update("horarioAtendimento", e.target.value)}
              className="w-full max-w-sm rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </Section>

        {/* ── Section: Mensagens personalizadas ── */}
        <Section
          title="Mensagens Personalizadas"
          icon={<Zap size={18} />}
          description="Edite as mensagens-chave que a IA envia"
          open={openSections.mensagens}
          onToggle={() => toggle("mensagens")}
        >
          <TextArea
            label="Mensagem de saudação"
            hint="Primeira mensagem que o cliente recebe. Use {imobiliária} para inserir o nome."
            value={config.saudacao}
            onChange={v => update("saudacao", v)}
            rows={3}
          />
          <TextArea
            label="Mensagem fora do horário"
            hint="Enviada quando o cliente fala fora do horário de atendimento humano."
            value={config.mensagemAusencia}
            onChange={v => update("mensagemAusencia", v)}
            rows={3}
            className="mt-4"
          />
          <TextArea
            label="Mensagem de encerramento"
            hint="Quando a conversa termina naturalmente."
            value={config.encerramento}
            onChange={v => update("encerramento", v)}
            rows={2}
            className="mt-4"
          />
        </Section>

        {/* ── Section: Handoff ── */}
        <Section
          title="Transferência para o Corretor"
          icon={<Users size={18} />}
          description="Quando a IA passa o lead pra você"
          open={openSections.handoff}
          onToggle={() => toggle("handoff")}
        >
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-start gap-3">
              <Info size={16} className="mt-0.5 shrink-0 text-brand" />
              <div className="text-sm text-ink-soft">
                <p>A IA dá uma <strong>nota de 0 a 18</strong> para cada lead com base nas respostas:</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li><span className="font-mono text-green-600">+3</span> Já arrematou antes</li>
                  <li><span className="font-mono text-green-600">+3</span> Tem imóvel específico em mente</li>
                  <li><span className="font-mono text-green-600">+3</span> Capital disponível ou crédito aprovado</li>
                  <li><span className="font-mono text-green-600">+2</span> Objetivo claro (morar ou investir)</li>
                  <li><span className="font-mono text-green-600">+2</span> Faixa de valor definida</li>
                  <li><span className="font-mono text-green-600">+2</span> Quer comprar em menos de 30 dias</li>
                  <li><span className="font-mono text-amber-600">−3</span> "Só estou entendendo como funciona"</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium text-ink">
              Nota mínima para transferir pra você
            </label>
            <p className="mb-3 text-xs text-ink-soft">
              Leads com nota igual ou acima deste valor são transferidos imediatamente. Os demais continuam sendo nutridos pela IA.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={6}
                max={18}
                step={1}
                value={config.scoreHandoff}
                onChange={e => update("scoreHandoff", Number(e.target.value))}
                className="flex-1 accent-brand"
              />
              <span className={`flex h-10 w-14 items-center justify-center rounded-lg text-lg font-bold ${
                config.scoreHandoff >= 12 ? "bg-brand-light text-brand" :
                config.scoreHandoff >= 8 ? "bg-accent-light text-accent" :
                "bg-red-50 text-danger"
              }`}>
                {config.scoreHandoff}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-ink-soft">
              <span>Mais leads (menos filtrado)</span>
              <span>Menos leads (mais qualificado)</span>
            </div>
          </div>
        </Section>

        {/* ── Section: Avançado ── */}
        <Section
          title="Avançado"
          icon={<Shield size={18} />}
          description="Restrições e regras adicionais"
          open={openSections.avancado}
          onToggle={() => toggle("avancado")}
        >
          <TextArea
            label="Frases ou assuntos proibidos"
            hint="Temas que a IA NÃO deve abordar. Um por linha."
            value={config.frasesProibidas}
            onChange={v => update("frasesProibidas", v)}
            rows={3}
            placeholder={"Ex.:\nNão mencionar concorrente X\nNão falar de preço de assessoria jurídica\nNão prometer prazo de desocupação"}
          />

          <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <h4 className="text-sm font-semibold text-ink">Regras fixas (não editáveis)</h4>
            <p className="mb-3 text-xs text-ink-soft">Estas regras existem para proteger você e seus clientes:</p>
            <ul className="space-y-2 text-xs text-ink-soft">
              <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 shrink-0 text-brand" /> Nunca dá parecer jurídico — direciona para advogado</li>
              <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 shrink-0 text-brand" /> Nunca garante prazos de desocupação</li>
              <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 shrink-0 text-brand" /> Nunca afirma que um leilão é seguro sem análise do edital</li>
              <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 shrink-0 text-brand" /> Nunca inventa dados de imóveis — só usa a base real</li>
              <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 shrink-0 text-brand" /> Nunca faz cálculos de cabeça — sempre usa o simulador</li>
              <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 shrink-0 text-brand" /> Se não souber algo, diz que não sabe e que você pode ajudar</li>
            </ul>
          </div>
        </Section>

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-surface/95 px-6 py-3 backdrop-blur-sm lg:left-[72px]">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <p className="text-xs text-ink-soft">As alterações serão aplicadas no próximo atendimento.</p>
            <Button onClick={handleSave} variant={saved ? "ghost" : "primary"}>
              <Save size={16} />
              {saved ? "Salvo!" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </Scroll>
  );
}

/* ── Reusable components ── */

function Section({
  title, icon, description, open, onToggle, children,
}: {
  title: string; icon: React.ReactNode; description: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <button onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand">
            {icon}
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
            <p className="text-xs text-ink-soft">{description}</p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-ink-soft" /> : <ChevronDown size={18} className="text-ink-soft" />}
      </button>
      {open && <div className="mt-5 border-t border-stone-100 pt-5">{children}</div>}
    </Card>
  );
}

function Field({
  label, hint, value, onChange, placeholder, className,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-ink-soft">{hint}</p>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

function TextArea({
  label, hint, value, onChange, rows = 3, placeholder, className,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; rows?: number; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-ink-soft">{hint}</p>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
