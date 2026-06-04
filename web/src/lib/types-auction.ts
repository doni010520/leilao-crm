// ─── Auction-specific types (extends base types.ts) ──────────────────

export type TipoImovel = "apartamento" | "casa" | "terreno" | "comercial" | "rural" | "outro";
export type TipoLeilao = "judicial" | "extrajudicial";
export type PropertyStatus = "aberto" | "em_andamento" | "arrematado" | "suspenso" | "frustrado" | "encerrado";
export type Ocupacao = "ocupado" | "desocupado" | "nao_informado";
export type LeadPerfil = "investidor_experiente" | "iniciante" | "casa_propria" | "flipper" | "renteiro" | "nao_definido";
export type ScoreLabel = "quente" | "morno" | "curioso";
export type LeadEstagio = "novo" | "qualificado" | "interessado" | "em_negociacao" | "proposta" | "convertido" | "perdido";
export type DealStatus = "acompanhando" | "lance_dado" | "arrematou" | "perdeu" | "desistiu";
export type ActivityTipo = "qualificacao" | "simulacao" | "interesse" | "handoff" | "nota" | "ligacao" | "email" | "visita" | "lance" | "arrematacao" | "sistema";

export interface Property {
  id: string;
  organization_id: string;
  external_id: string | null;
  fonte: string;
  url_original: string | null;
  tipo_leilao: TipoLeilao | null;
  banco: string | null;
  leiloeiro: string | null;
  tipo_imovel: TipoImovel | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  area_privativa: number | null;
  area_terreno: number | null;
  quartos: number | null;
  vagas: number | null;
  valor_avaliacao: number | null;
  lance_minimo: number | null;
  desconto_pct: number | null;
  praca: string | null;
  data_leilao: string | null;
  status: PropertyStatus;
  ocupacao: Ocupacao;
  dividas: string | null;
  edital_url: string | null;
  imagem_url: string | null;
  aceita_financiamento: boolean | null;
  aceita_fgts: boolean | null;
  score_risco: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadQualification {
  id: string;
  organization_id: string;
  contact_id: string;
  perfil: LeadPerfil;
  score_valor: number;
  score_label: ScoreLabel;
  estagio: LeadEstagio;
  objetivo: string | null;
  regiao_interesse: string | null;
  faixa_valor_min: number | null;
  faixa_valor_max: number | null;
  forma_pagamento: string | null;
  capital_disponivel: boolean | null;
  prazo_compra: string | null;
  ja_arrematou: boolean | null;
  assigned_user_id: string | null;
  notas_corretor: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineOverview extends LeadQualification {
  qualification_id: string;
  contact_name: string | null;
  contact_phone: string;
  contact_avatar: string | null;
  deal_count: number;
  last_message_at: string | null;
}

export interface Deal {
  id: string;
  organization_id: string;
  contact_id: string;
  property_id: string | null;
  assigned_user_id: string | null;
  title: string;
  valor_pretendido: number | null;
  status: DealStatus;
  data_leilao: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  contact_name?: string | null;
  property_cidade?: string | null;
  property_endereco?: string | null;
}

export interface Activity {
  id: string;
  organization_id: string;
  contact_id: string;
  deal_id: string | null;
  user_id: string | null;
  tipo: ActivityTipo;
  descricao: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  contact_id: string | null;
  deal_id: string | null;
  assigned_user_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}
