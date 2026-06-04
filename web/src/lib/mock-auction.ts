import type { Property, PipelineOverview, Deal, Activity, Task } from "./types-auction";

const ORG = "preview";
const now = new Date().toISOString();

export const MOCK_PROPERTIES: Property[] = [
  {
    id: "p1", organization_id: ORG, external_id: "CAIXA-SP-001", fonte: "caixa", url_original: null,
    tipo_leilao: "extrajudicial", banco: "Caixa Econômica Federal", leiloeiro: "Superbid",
    tipo_imovel: "apartamento", endereco: "Rua Augusta, 1200 — Apto 42", bairro: "Consolação",
    cidade: "São Paulo", estado: "SP", cep: "01304-001",
    area_privativa: 68, area_terreno: null, quartos: 2, vagas: 1,
    valor_avaliacao: 520000, lance_minimo: 312000, desconto_pct: 40,
    praca: "2ª", data_leilao: "2026-07-15T10:00:00Z", status: "aberto",
    ocupacao: "ocupado", dividas: null, edital_url: null, imagem_url: null,
    aceita_financiamento: false, aceita_fgts: false, score_risco: null, notas: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p2", organization_id: ORG, external_id: "CAIXA-SP-002", fonte: "caixa", url_original: null,
    tipo_leilao: "extrajudicial", banco: "Caixa Econômica Federal", leiloeiro: "Mega Leilões",
    tipo_imovel: "casa", endereco: "Rua das Palmeiras, 450", bairro: "Jardim Europa",
    cidade: "Campinas", estado: "SP", cep: "13090-000",
    area_privativa: 120, area_terreno: 200, quartos: 3, vagas: 2,
    valor_avaliacao: 680000, lance_minimo: 374000, desconto_pct: 45,
    praca: "2ª", data_leilao: "2026-07-22T14:00:00Z", status: "aberto",
    ocupacao: "desocupado", dividas: null, edital_url: null, imagem_url: null,
    aceita_financiamento: true, aceita_fgts: false, score_risco: null, notas: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p3", organization_id: ORG, external_id: "ZUK-RJ-001", fonte: "zuk", url_original: null,
    tipo_leilao: "extrajudicial", banco: "Itaú", leiloeiro: "Zuk Leilões",
    tipo_imovel: "apartamento", endereco: "Av. Atlântica, 2800 — Apto 1201", bairro: "Copacabana",
    cidade: "Rio de Janeiro", estado: "RJ", cep: "22041-001",
    area_privativa: 95, area_terreno: null, quartos: 3, vagas: 1,
    valor_avaliacao: 1200000, lance_minimo: 720000, desconto_pct: 40,
    praca: "1ª", data_leilao: "2026-07-10T10:00:00Z", status: "aberto",
    ocupacao: "nao_informado", dividas: null, edital_url: null, imagem_url: null,
    aceita_financiamento: true, aceita_fgts: false, score_risco: null, notas: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p4", organization_id: ORG, external_id: "BRAD-SP-001", fonte: "bradesco", url_original: null,
    tipo_leilao: "extrajudicial", banco: "Bradesco", leiloeiro: "Sodré Santoro",
    tipo_imovel: "apartamento", endereco: "Rua Oscar Freire, 680 — Apto 91", bairro: "Jardins",
    cidade: "São Paulo", estado: "SP", cep: "01426-000",
    area_privativa: 140, area_terreno: null, quartos: 4, vagas: 2,
    valor_avaliacao: 1800000, lance_minimo: 810000, desconto_pct: 55,
    praca: "2ª", data_leilao: "2026-07-08T10:00:00Z", status: "aberto",
    ocupacao: "ocupado", dividas: "Condomínio: R$ 45.000", edital_url: null, imagem_url: null,
    aceita_financiamento: false, aceita_fgts: false, score_risco: null, notas: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p5", organization_id: ORG, external_id: "MEGA-MG-001", fonte: "mega", url_original: null,
    tipo_leilao: "judicial", banco: null, leiloeiro: "Mega Leilões",
    tipo_imovel: "terreno", endereco: "Rodovia MG-030, Km 12", bairro: "Nova Lima",
    cidade: "Nova Lima", estado: "MG", cep: "34000-000",
    area_privativa: null, area_terreno: 500, quartos: null, vagas: null,
    valor_avaliacao: 350000, lance_minimo: 175000, desconto_pct: 50,
    praca: "2ª", data_leilao: "2026-08-01T10:00:00Z", status: "aberto",
    ocupacao: "desocupado", dividas: null, edital_url: null, imagem_url: null,
    aceita_financiamento: false, aceita_fgts: false, score_risco: null, notas: null,
    created_at: now, updated_at: now,
  },
];

export const MOCK_PIPELINE: PipelineOverview[] = [
  {
    id: "lq1", qualification_id: "lq1", organization_id: ORG, contact_id: "c1",
    perfil: "investidor_experiente", score_valor: 15, score_label: "quente",
    estagio: "qualificado", objetivo: "investir", regiao_interesse: "São Paulo - SP",
    faixa_valor_min: 200000, faixa_valor_max: 500000, forma_pagamento: "avista",
    capital_disponivel: true, prazo_compra: "imediato", ja_arrematou: true,
    assigned_user_id: null, notas_corretor: null,
    contact_name: "Carlos Investidor", contact_phone: "5511999990001", contact_avatar: null,
    deal_count: 1, last_message_at: now, created_at: now, updated_at: now,
  },
  {
    id: "lq2", qualification_id: "lq2", organization_id: ORG, contact_id: "c2",
    perfil: "casa_propria", score_valor: 9, score_label: "morno",
    estagio: "interessado", objetivo: "morar", regiao_interesse: "Campinas - SP",
    faixa_valor_min: 150000, faixa_valor_max: 350000, forma_pagamento: "financiamento",
    capital_disponivel: false, prazo_compra: "60dias", ja_arrematou: false,
    assigned_user_id: null, notas_corretor: null,
    contact_name: "Ana Martins", contact_phone: "5511999990002", contact_avatar: null,
    deal_count: 0, last_message_at: now, created_at: now, updated_at: now,
  },
  {
    id: "lq3", qualification_id: "lq3", organization_id: ORG, contact_id: "c3",
    perfil: "nao_definido", score_valor: 3, score_label: "curioso",
    estagio: "novo", objetivo: "entender", regiao_interesse: null,
    faixa_valor_min: null, faixa_valor_max: null, forma_pagamento: null,
    capital_disponivel: null, prazo_compra: "sem_prazo", ja_arrematou: false,
    assigned_user_id: null, notas_corretor: null,
    contact_name: "Pedro Curioso", contact_phone: "5511999990003", contact_avatar: null,
    deal_count: 0, last_message_at: now, created_at: now, updated_at: now,
  },
  {
    id: "lq4", qualification_id: "lq4", organization_id: ORG, contact_id: "c4",
    perfil: "flipper", score_valor: 14, score_label: "quente",
    estagio: "em_negociacao", objetivo: "revender", regiao_interesse: "Rio de Janeiro - RJ",
    faixa_valor_min: 400000, faixa_valor_max: 800000, forma_pagamento: "avista",
    capital_disponivel: true, prazo_compra: "imediato", ja_arrematou: true,
    assigned_user_id: null, notas_corretor: "Vai dar lance no apto de Copacabana dia 10/07",
    contact_name: "Roberto Flipper", contact_phone: "5521999990004", contact_avatar: null,
    deal_count: 2, last_message_at: now, created_at: now, updated_at: now,
  },
  {
    id: "lq5", qualification_id: "lq5", organization_id: ORG, contact_id: "c5",
    perfil: "renteiro", score_valor: 11, score_label: "morno",
    estagio: "interessado", objetivo: "alugar", regiao_interesse: "São Paulo - SP",
    faixa_valor_min: 150000, faixa_valor_max: 400000, forma_pagamento: "financiamento",
    capital_disponivel: true, prazo_compra: "30dias", ja_arrematou: false,
    assigned_user_id: null, notas_corretor: null,
    contact_name: "Fernanda Renda", contact_phone: "5511999990005", contact_avatar: null,
    deal_count: 0, last_message_at: now, created_at: now, updated_at: now,
  },
];

export const MOCK_DEALS: Deal[] = [
  {
    id: "d1", organization_id: ORG, contact_id: "c1", property_id: "p1",
    assigned_user_id: null, title: "Apto Consolação — Carlos",
    valor_pretendido: 320000, status: "acompanhando",
    data_leilao: "2026-07-15T10:00:00Z", notas: null,
    contact_name: "Carlos Investidor", property_cidade: "São Paulo",
    property_endereco: "Rua Augusta, 1200",
    created_at: now, updated_at: now,
  },
  {
    id: "d2", organization_id: ORG, contact_id: "c4", property_id: "p3",
    assigned_user_id: null, title: "Apto Copacabana — Roberto",
    valor_pretendido: 750000, status: "lance_dado",
    data_leilao: "2026-07-10T10:00:00Z", notas: "Lance de R$ 750k registrado",
    contact_name: "Roberto Flipper", property_cidade: "Rio de Janeiro",
    property_endereco: "Av. Atlântica, 2800",
    created_at: now, updated_at: now,
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: "a1", organization_id: ORG, contact_id: "c1", deal_id: null, user_id: null, tipo: "qualificacao", descricao: "Agente IA qualificou como investidor experiente — Score 15 (quente)", metadata: { score: 15 }, created_at: now },
  { id: "a2", organization_id: ORG, contact_id: "c1", deal_id: null, user_id: null, tipo: "simulacao", descricao: "Simulou ROI do Apto Consolação: margem 22% na revenda", metadata: { margem: 22 }, created_at: now },
  { id: "a3", organization_id: ORG, contact_id: "c1", deal_id: "d1", user_id: null, tipo: "interesse", descricao: "Demonstrou interesse no Apto Consolação (R$ 312k)", metadata: {}, created_at: now },
  { id: "a4", organization_id: ORG, contact_id: "c1", deal_id: null, user_id: null, tipo: "handoff", descricao: "Transferido para corretor — Lead quente, urgência alta", metadata: {}, created_at: now },
  { id: "a5", organization_id: ORG, contact_id: "c4", deal_id: "d2", user_id: null, tipo: "lance", descricao: "Lance de R$ 750.000 registrado no Apto Copacabana", metadata: { valor: 750000 }, created_at: now },
];

export const MOCK_TASKS: Task[] = [
  { id: "t1", organization_id: ORG, contact_id: "c1", deal_id: "d1", assigned_user_id: null, title: "Ligar para confirmar participação no leilão dia 15/07", description: null, due_date: "2026-07-14T10:00:00Z", completed: false, completed_at: null, created_at: now },
  { id: "t2", organization_id: ORG, contact_id: "c4", deal_id: "d2", assigned_user_id: null, title: "Enviar edital do apto Copacabana", description: null, due_date: "2026-07-08T10:00:00Z", completed: true, completed_at: now, created_at: now },
];

export const MOCK_AUCTION_STATS = {
  leads: { total: 5, quentes: 2, mornos: 2, curiosos: 1, esta_semana: 3, taxa_conversao: 20 },
  imoveis: { total: 5, abertos: 5 },
  deals: { total: 2, em_andamento: 1, valor_pipeline: 1070000 },
  atendimento: { mensagens_hoje: 24, total_conversas: 8 },
};
