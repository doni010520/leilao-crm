"use client";

import { useState } from "react";
import { Bot, Save, Users, MapPin, Sparkles, GripVertical, Plus, Trash2, ChevronDown, ChevronUp, Info, BookOpen } from "lucide-react";
import { PageHeader, Button, Card } from "@/components/ui";
import { Scroll } from "@/components/scroll";

interface AgentConfig {
  nomeImobiliaria: string;
  nomeCorretor: string;
  creci: string;
  whatsappCorretor: string;
  regioes: string;
  diferencial: string;
  saudacao: string;
  perguntas: string[];
  baseConhecimento: string;
  nivelHandoff: "compradores" | "interessados" | "todos";
  horarioAtendimento: string;
}

const DEFAULT_PERGUNTAS = [
  "Você já participou de algum leilão de imóvel antes, ou seria sua primeira vez?",
  "O que você está buscando: comprar pra morar, investir e revender, ou ainda está entendendo como funciona?",
  "Tem algum imóvel ou leilão específico em mente, ou quer que a gente garimpe oportunidades pra você?",
  "Qual região te interessa? (cidade, estado ou bairro)",
  "Qual faixa de valor você está considerando pro lance?",
  "Pretende pagar à vista ou precisaria de financiamento?",
  "Tem ideia de quando gostaria de arrematar? Próximos dias, semanas, ou sem prazo?",
];

const DEFAULT_CONFIG: AgentConfig = {
  nomeImobiliaria: "",
  nomeCorretor: "",
  creci: "",
  whatsappCorretor: "",
  regioes: "",
  diferencial: "",
  saudacao: "Olá! 👋 Sou o assistente virtual da {imobiliária}. Posso te ajudar a encontrar oportunidades em leilões de imóveis com até 60% de desconto. Você já participou de algum leilão antes?",
  perguntas: [...DEFAULT_PERGUNTAS],
  baseConhecimento: "",
  nivelHandoff: "interessados",
  horarioAtendimento: "Seg a Sex, 8h às 18h",
};

const HANDOFF_OPTIONS = [
  {
    value: "compradores" as const,
    title: "Só compradores prontos",
    desc: "A IA só te avisa quando o lead tem dinheiro, imóvel em mente e quer comprar agora.",
    example: "Ex.: \"Tenho R$ 300k à vista, quero o apto da Rua Augusta no leilão dia 15.\"",
    icon: "🎯",
  },
  {
    value: "interessados" as const,
    title: "Interessados reais",
    desc: "A IA te avisa quando identifica interesse real — tem objetivo claro e faixa de valor, mesmo que ainda esteja decidindo.",
    example: "Ex.: \"Quero investir em leilão, tenho até R$ 400k, preciso entender melhor.\"",
    icon: "🤝",
    recommended: true,
  },
  {
    value: "todos" as const,
    title: "Todo mundo",
    desc: "A IA te avisa pra qualquer pessoa que interagir. Você fala com todos, a IA só faz o primeiro contato.",
    example: "Ex.: \"Vi um vídeo sobre leilão, como funciona?\"",
    icon: "📢",
  },
];

export default function AgentConfigPage() {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identidade: true,
    saudacao: true,
    perguntas: true,
    conhecimento: false,
    handoff: true,
  });

  function toggle(section: string) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  function update<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function addPergunta() {
    update("perguntas", [...config.perguntas, ""]);
  }

  function removePergunta(index: number) {
    update("perguntas", config.perguntas.filter((_, i) => i !== index));
  }

  function updatePergunta(index: number, value: string) {
    const next = [...config.perguntas];
    next[index] = value;
    update("perguntas", next);
  }

  function movePergunta(from: number, to: number) {
    if (to < 0 || to >= config.perguntas.length) return;
    const next = [...config.perguntas];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update("perguntas", next);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Scroll>
      <div className="mx-auto max-w-3xl pb-20">
        <PageHeader
          title="Agente de IA"
          subtitle="Configure o assistente que atende seus clientes no WhatsApp 24/7"
          action={
            <Button onClick={handleSave} variant={saved ? "ghost" : "primary"}>
              <Save size={16} /> {saved ? "Salvo!" : "Salvar"}
            </Button>
          }
        />

        {/* Hero */}
        <Card className="mb-8 border-accent/30 bg-accent-light/50">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Bot size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink">Como funciona</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Quando um cliente manda mensagem no WhatsApp, a IA responde automaticamente.
                Ela <strong>acolhe</strong>, <strong>faz as perguntas que você definir</strong>, <strong>apresenta imóveis da sua base</strong> e
                <strong> avisa você</strong> quando o lead está pronto. Personalize tudo abaixo.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Identidade ── */}
        <Section title="Sobre sua imobiliária" icon={<Users size={18} />} desc="A IA se apresenta com esses dados" open={openSections.identidade} onToggle={() => toggle("identidade")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da imobiliária" hint="A IA diz: 'Sou o assistente da...'" value={config.nomeImobiliaria} onChange={v => update("nomeImobiliaria", v)} placeholder="Ex.: Imob Leilões SP" />
            <Field label="Seu nome" hint="A IA diz: 'Vou te conectar com...'" value={config.nomeCorretor} onChange={v => update("nomeCorretor", v)} placeholder="Ex.: Adonias" />
            <Field label="CRECI" hint="Mostrado se o cliente perguntar" value={config.creci} onChange={v => update("creci", v)} placeholder="Ex.: 123456-F/SP" />
            <Field label="Seu WhatsApp" hint="Para onde a IA transfere leads" value={config.whatsappCorretor} onChange={v => update("whatsappCorretor", v)} placeholder="5511999999999" />
          </div>
          <Field label="Regiões de atuação" value={config.regioes} onChange={v => update("regioes", v)} placeholder="Ex.: São Paulo capital, ABC, Campinas" className="mt-4" />
          <Field label="Seu diferencial" hint="O que te diferencia. A IA menciona quando faz sentido." value={config.diferencial} onChange={v => update("diferencial", v)} placeholder="Ex.: 10 anos de experiência, acompanhamento jurídico incluso" className="mt-4" />
          <Field label="Horário de atendimento" hint="Fora desse horário a IA continua atendendo, mas avisa que você retorna no próximo dia útil." value={config.horarioAtendimento} onChange={v => update("horarioAtendimento", v)} className="mt-4" />
        </Section>

        {/* ── Saudação ── */}
        <Section title="Mensagem de saudação" icon={<Sparkles size={18} />} desc="Primeira mensagem que o cliente recebe" open={openSections.saudacao} onToggle={() => toggle("saudacao")}>
          <div>
            <p className="mb-2 text-xs text-ink-soft">Use <code className="rounded bg-stone-100 px-1 py-0.5 text-[11px]">{"{imobiliária}"}</code> para inserir o nome automaticamente.</p>
            <textarea
              value={config.saudacao}
              onChange={e => update("saudacao", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </Section>

        {/* ── Perguntas de qualificação ── */}
        <Section title="Perguntas de qualificação" icon={<Info size={18} />} desc="A IA faz essas perguntas uma a uma, na ordem" open={openSections.perguntas} onToggle={() => toggle("perguntas")}>
          <p className="mb-4 text-xs text-ink-soft">
            Arraste para reordenar. A IA faz cada pergunta naturalmente durante a conversa — não como formulário.
            Adicione perguntas específicas do seu negócio.
          </p>
          <div className="space-y-2">
            {config.perguntas.map((p, i) => (
              <div key={i} className="group flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-3 transition hover:border-stone-300">
                <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                  <button onClick={() => movePergunta(i, i - 1)} disabled={i === 0} className="text-stone-300 hover:text-ink disabled:opacity-30" aria-label="Mover para cima">
                    <ChevronUp size={14} />
                  </button>
                  <GripVertical size={14} className="text-stone-300" />
                  <button onClick={() => movePergunta(i, i + 1)} disabled={i === config.perguntas.length - 1} className="text-stone-300 hover:text-ink disabled:opacity-30" aria-label="Mover para baixo">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <span className="mt-2 shrink-0 text-xs font-semibold text-ink-soft">{i + 1}.</span>
                <textarea
                  value={p}
                  onChange={e => updatePergunta(i, e.target.value)}
                  rows={2}
                  placeholder="Digite a pergunta..."
                  className="flex-1 resize-none rounded border-0 bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-stone-400"
                />
                <button onClick={() => removePergunta(i)} className="mt-1 shrink-0 rounded p-1 text-stone-300 transition hover:bg-red-50 hover:text-danger" aria-label="Remover pergunta">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addPergunta}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-200 py-3 text-sm font-medium text-ink-soft transition hover:border-brand hover:text-brand"
          >
            <Plus size={16} /> Adicionar pergunta
          </button>
        </Section>

        {/* ── Base de conhecimento ── */}
        <Section title="Base de conhecimento" icon={<BookOpen size={18} />} desc="Informações extras que a IA deve saber sobre sua empresa" open={openSections.conhecimento} onToggle={() => toggle("conhecimento")}>
          <p className="mb-3 text-xs text-ink-soft">
            Cole aqui tudo que a IA deve saber: serviços que você oferece, regras de pagamento,
            tipos de leilão que trabalha, parcerias, qualquer informação que um cliente pode perguntar.
            Escreva como se estivesse explicando pra um colega de trabalho.
          </p>
          <textarea
            value={config.baseConhecimento}
            onChange={e => update("baseConhecimento", e.target.value)}
            rows={8}
            placeholder={"Ex.:\n- Trabalhamos com leilões extrajudiciais da Caixa, Itaú e Bradesco\n- Oferecemos assessoria jurídica inclusa no serviço\n- Comissão: 5% sobre o valor do arremate\n- Aceitamos clientes que querem financiar pelo banco\n- Atuamos em São Paulo capital e região metropolitana\n- Temos parceria com o escritório X para desocupação"}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </Section>

        {/* ── Quando me avisar ── */}
        <Section title="Quando a IA te avisa" icon={<Users size={18} />} desc="Qual tipo de lead chega até você" open={openSections.handoff} onToggle={() => toggle("handoff")}>
          <div className="space-y-3">
            {HANDOFF_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update("nivelHandoff", opt.value)}
                className={`w-full rounded-xl border-2 p-5 text-left transition-all ${
                  config.nivelHandoff === opt.value
                    ? "border-brand bg-brand-light/50 shadow-sm"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-bold text-ink">{opt.title}</p>
                      {opt.recommended && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">Recomendado</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{opt.desc}</p>
                    <p className="mt-2 text-xs italic text-ink-soft/70">{opt.example}</p>
                  </div>
                  <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    config.nivelHandoff === opt.value ? "border-brand bg-brand" : "border-stone-300"
                  }`}>
                    {config.nivelHandoff === opt.value && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Sticky save */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-surface/95 px-6 py-3 backdrop-blur-sm lg:left-[72px]">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <p className="text-xs text-ink-soft">As alterações valem a partir do próximo atendimento.</p>
            <Button onClick={handleSave} variant={saved ? "ghost" : "primary"}>
              <Save size={16} /> {saved ? "Salvo!" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </Scroll>
  );
}

function Section({ title, icon, desc, open, onToggle, children }: {
  title: string; icon: React.ReactNode; desc: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <button onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand">{icon}</div>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
            <p className="text-xs text-ink-soft">{desc}</p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-ink-soft" /> : <ChevronDown size={18} className="text-ink-soft" />}
      </button>
      {open && <div className="mt-5 border-t border-stone-100 pt-5">{children}</div>}
    </Card>
  );
}

function Field({ label, hint, value, onChange, placeholder, className }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-ink-soft">{hint}</p>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20" />
    </div>
  );
}
