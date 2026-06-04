import type { Channel, ConversationOverview, Message, Department, Tag, QuickReply, Profile } from "@/lib/types";

// Dados de exemplo usados no "modo preview" (sem Supabase configurado),
// inspirados na conta real para a tela ficar realista.
export const MOCK_CHANNELS: Channel[] = [
  mk("Leilão SP — API Oficial", "meta_cloud", "5511999880001", "connected"),
  mk("Leilão RJ — API Oficial", "meta_cloud", "5521999880002", "connected"),
  mk("Atendimento Geral", "uazapi", "5511999880003", "connected"),
  mk("Captação de Leads", "uazapi", "5511999880004", "connected"),
  mk("Pós-Arremate", "uazapi", "5511999880005", "disconnected"),
];

function mk(
  name: string,
  type: Channel["type"],
  phone: string,
  status: Channel["status"],
): Channel {
  return {
    id: crypto.randomUUID(),
    organization_id: "preview",
    name,
    type,
    phone,
    status,
    external_id: null,
    credentials: {},
    created_at: new Date().toISOString(),
  };
}

export const PREVIEW_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const MOCK_DEPARTMENTS: Department[] = [
  { id: "d1", organization_id: "preview", name: "Captação", color: "#1a3c34", created_at: "" },
  { id: "d2", organization_id: "preview", name: "Negociação", color: "#c8911f", created_at: "" },
  { id: "d3", organization_id: "preview", name: "Pós-venda", color: "#16a34a", created_at: "" },
];

export const MOCK_TAGS: Tag[] = [
  { id: "t1", organization_id: "preview", name: "Qualificado", color: "#16a34a", scope: "conversation", created_at: "" },
  { id: "t2", organization_id: "preview", name: "Aguardando leilão", color: "#c8911f", scope: "conversation", created_at: "" },
  { id: "t3", organization_id: "preview", name: "Investidor", color: "#1a3c34", scope: "contact", created_at: "" },
  { id: "t4", organization_id: "preview", name: "1ª compra", color: "#6b7280", scope: "contact", created_at: "" },
];

export const MOCK_QUICK_REPLIES: QuickReply[] = [
  { id: "q1", organization_id: "preview", title: "Saudação", content: "Olá! Sou o assistente da imobiliária. Como posso ajudar com leilões de imóveis?", shortcut: "/oi", kind: "model", created_at: "" },
  { id: "q2", organization_id: "preview", title: "Como funciona", content: "Leilão de imóveis é a compra com desconto de até 60% do valor de mercado. Quer que eu busque oportunidades na sua região?", shortcut: "/como", kind: "model", created_at: "" },
];

export const MOCK_AGENTS: Profile[] = [
  { id: "u1", organization_id: "preview", name: "Juliana Corretora", email: "juliana@leilaocrm.com.br", role: "agent", department_id: "d1", avatar_url: null, status: "online", whatsapp: null, notify: true, created_at: "" },
  { id: "u2", organization_id: "preview", name: "Rafael Broker", email: "rafael@leilaocrm.com.br", role: "supervisor", department_id: "d2", avatar_url: null, status: "away", whatsapp: null, notify: true, created_at: "" },
  { id: "u3", organization_id: "preview", name: "Adonias Souza", email: "adonias@leilaocrm.com.br", role: "admin", department_id: null, avatar_url: null, status: "offline", whatsapp: null, notify: true, created_at: "" },
];

// ---------- Conversas e mensagens (modo preview) ----------
const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export const MOCK_CONVERSATIONS: ConversationOverview[] = [
  conv("Carlos Investidor", "5511999990001", "Atendimento Geral", "uazapi", "open", "Vi um apto na Consolação por R$ 312 mil. Quero mais detalhes sobre o leilão.", 2),
  conv("Ana Martins", "5511999990002", "Leilão SP — API Oficial", "meta_cloud", "queued", "Quero saber como funciona leilão de imóveis da Caixa", 11),
  conv("Roberto Flipper", "5521999990003", "Leilão RJ — API Oficial", "meta_cloud", "open", "Fiz o lance no apto de Copacabana, acompanha pra mim?", 25),
  conv("Fernanda Renda", "5511999990004", "Captação de Leads", "uazapi", "bot", "menu", 40),
  conv("Pedro Curioso", "5511999990005", "Atendimento Geral", "uazapi", "closed", "Obrigado, vou pensar na proposta!", 180),
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  [MOCK_CONVERSATIONS[0].id]: [
    msg(MOCK_CONVERSATIONS[0].id, "in", "contact", "Boa tarde! Vi um apto na Consolação em leilão.", 6),
    msg(MOCK_CONVERSATIONS[0].id, "out", "agent", "Boa tarde, Carlos! É o da Rua Augusta, lance mínimo R$ 312k com 40% de desconto. Quer que eu calcule a viabilidade?", 5),
    msg(MOCK_CONVERSATIONS[0].id, "in", "contact", "Sim, por favor! Quero investir à vista.", 2),
  ],
  [MOCK_CONVERSATIONS[1].id]: [
    msg(MOCK_CONVERSATIONS[1].id, "in", "contact", "Como funciona leilão de imóveis da Caixa?", 11),
  ],
  [MOCK_CONVERSATIONS[2].id]: [
    msg(MOCK_CONVERSATIONS[2].id, "in", "contact", "Fiz o lance no apto de Copacabana, acompanha pra mim?", 25),
  ],
};

function conv(
  name: string,
  phone: string,
  channelName: string,
  channelType: Channel["type"],
  status: ConversationOverview["status"],
  last: string,
  minAgo: number,
): ConversationOverview {
  const id = crypto.randomUUID();
  return {
    id,
    organization_id: "preview",
    status,
    assigned_user_id: null,
    department_id: null,
    channel_id: "preview",
    contact_id: crypto.randomUUID(),
    protocol: null,
    last_message_at: ago(minAgo),
    opened_at: ago(minAgo + 10),
    closed_at: null,
    created_at: ago(minAgo + 10),
    contact_name: name,
    contact_phone: phone,
    contact_avatar: null,
    channel_name: channelName,
    channel_type: channelType,
    last_message_body: last,
    last_message_type: "text",
    last_message_direction: "in",
  };
}

function msg(
  conversationId: string,
  direction: Message["direction"],
  sender: Message["sender_type"],
  body: string,
  minAgo: number,
): Message {
  return {
    id: crypto.randomUUID(),
    organization_id: "preview",
    conversation_id: conversationId,
    direction,
    sender_type: sender,
    sender_id: null,
    content_type: "text",
    body,
    media_url: null,
    status: "delivered",
    external_id: null,
    created_at: ago(minAgo),
  };
}
