-- =====================================================================
-- Leilão CRM — Auction-specific tables
-- =====================================================================

-- ---------------------------------------------------------------------
-- Imóveis de leilão (captados por scraper ou cadastro manual)
-- ---------------------------------------------------------------------
create table properties (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  external_id     text,
  fonte           text not null default 'manual',
  url_original    text,

  tipo_leilao     text check (tipo_leilao in ('judicial','extrajudicial')),
  banco           text,
  leiloeiro       text,
  tipo_imovel     text check (tipo_imovel in ('apartamento','casa','terreno','comercial','rural','outro')),

  endereco        text,
  bairro          text,
  cidade          text,
  estado          text,
  cep             text,

  area_privativa  numeric,
  area_terreno    numeric,
  quartos         int,
  vagas           int,

  valor_avaliacao numeric,
  lance_minimo    numeric,
  desconto_pct    numeric,

  praca           text,
  data_leilao     timestamptz,
  status          text not null default 'aberto'
                    check (status in ('aberto','em_andamento','arrematado','suspenso','frustrado','encerrado')),

  ocupacao        text not null default 'nao_informado'
                    check (ocupacao in ('ocupado','desocupado','nao_informado')),
  dividas         text,
  edital_url      text,
  matricula_url   text,
  imagem_url      text,

  aceita_financiamento boolean,
  aceita_fgts     boolean,
  score_risco     int,
  notas           text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on properties (organization_id, estado, status);
create index on properties (organization_id, cidade);

-- ---------------------------------------------------------------------
-- Qualificação de leads (dados do agente de IA)
-- Estende contacts com dados específicos de leilão
-- ---------------------------------------------------------------------
create table lead_qualifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id      uuid not null references contacts (id) on delete cascade,

  perfil          text default 'nao_definido'
                    check (perfil in ('investidor_experiente','iniciante','casa_propria','flipper','renteiro','nao_definido')),
  score_valor     int not null default 0,
  score_label     text not null default 'curioso'
                    check (score_label in ('quente','morno','curioso')),
  estagio         text not null default 'novo'
                    check (estagio in ('novo','qualificado','interessado','em_negociacao','proposta','convertido','perdido')),

  objetivo        text,
  regiao_interesse text,
  tipo_imovel_interesse text,
  faixa_valor_min numeric,
  faixa_valor_max numeric,
  forma_pagamento text,
  capital_disponivel boolean,
  prazo_compra    text,
  ja_arrematou    boolean,
  origem          text,

  assigned_user_id uuid references profiles (id) on delete set null,
  notas_corretor  text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (organization_id, contact_id)
);
create index on lead_qualifications (organization_id, score_label);
create index on lead_qualifications (organization_id, estagio);

-- ---------------------------------------------------------------------
-- Deals / Negociações (lead + imóvel específico)
-- ---------------------------------------------------------------------
create table deals (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id      uuid not null references contacts (id) on delete cascade,
  property_id     uuid references properties (id) on delete set null,
  assigned_user_id uuid references profiles (id) on delete set null,

  title           text not null,
  valor_pretendido numeric,
  status          text not null default 'acompanhando'
                    check (status in ('acompanhando','lance_dado','arrematou','perdeu','desistiu')),

  data_leilao     timestamptz,
  notas           text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on deals (organization_id, status);

-- ---------------------------------------------------------------------
-- Timeline de atividades (alimentada pelo agente + corretores)
-- ---------------------------------------------------------------------
create table activities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id      uuid not null references contacts (id) on delete cascade,
  deal_id         uuid references deals (id) on delete cascade,
  user_id         uuid references profiles (id) on delete set null,

  tipo            text not null
                    check (tipo in (
                      'qualificacao','simulacao','interesse','handoff',
                      'nota','ligacao','email','visita','lance','arrematacao',
                      'sistema'
                    )),
  descricao       text not null,
  metadata        jsonb not null default '{}',

  created_at      timestamptz not null default now()
);
create index on activities (organization_id, contact_id, created_at desc);

-- ---------------------------------------------------------------------
-- Tarefas / follow-ups
-- ---------------------------------------------------------------------
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id      uuid references contacts (id) on delete cascade,
  deal_id         uuid references deals (id) on delete cascade,
  assigned_user_id uuid references profiles (id) on delete set null,

  title           text not null,
  description     text,
  due_date        timestamptz,
  completed       boolean not null default false,
  completed_at    timestamptz,

  created_at      timestamptz not null default now()
);
create index on tasks (organization_id, assigned_user_id, completed, due_date);

-- ---------------------------------------------------------------------
-- View: pipeline overview (leads com qualificação + último contato)
-- ---------------------------------------------------------------------
create or replace view pipeline_overview as
select
  lq.id as qualification_id,
  lq.organization_id,
  lq.contact_id,
  lq.perfil,
  lq.score_valor,
  lq.score_label,
  lq.estagio,
  lq.objetivo,
  lq.regiao_interesse,
  lq.faixa_valor_min,
  lq.faixa_valor_max,
  lq.forma_pagamento,
  lq.capital_disponivel,
  lq.prazo_compra,
  lq.ja_arrematou,
  lq.assigned_user_id,
  lq.notas_corretor,
  lq.created_at as qualified_at,
  lq.updated_at,
  c.name as contact_name,
  c.phone as contact_phone,
  c.avatar_url as contact_avatar,
  (select count(*) from deals d where d.contact_id = c.id and d.organization_id = lq.organization_id) as deal_count,
  (select max(created_at) from messages m
   join conversations conv on conv.id = m.conversation_id
   where conv.contact_id = c.id and conv.organization_id = lq.organization_id
  ) as last_message_at
from lead_qualifications lq
join contacts c on c.id = lq.contact_id;
