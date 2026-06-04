# LeilãoCRM — CRM + Agente de IA para Imobiliárias de Leilão

Plataforma completa para imobiliárias especializadas em leilão de imóveis: CRM com pipeline de leads, base de imóveis, negociações, tarefas, e agente de IA que atende via WhatsApp e qualifica leads automaticamente.

## Arquitetura

```
leilao-crm/
├── web/                    ← CRM Frontend (Next.js 16 + Supabase)
│   ├── src/app/(app)/      ← Páginas: Dashboard, Pipeline, Imóveis, Negócios, Tarefas, Atendimento...
│   ├── src/components/     ← Kanban, Inbox, PropertyCards, Charts...
│   ├── src/lib/            ← Types, data layer, auth, WhatsApp handlers
│   └── supabase/           ← Migrations (16 tabelas base + 5 de leilão)
├── agent/                  ← Agente de IA (FastAPI + OpenAI)
│   ├── app/tools/          ← 6 ferramentas: buscar, simular, qualificar, transferir...
│   ├── prompts/            ← System prompt do agente de leilão
│   └── scrapers/           ← Caixa, Zuk, importação JSON
└── docker-compose.yml
```

## Stack

| Camada | Tecnologia |
|---|---|
| CRM Frontend | Next.js 16, React 19, Tailwind CSS v4, Recharts, XY Flow |
| Banco + Auth | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Agente IA | FastAPI, OpenAI GPT-4.1, function calling |
| WhatsApp | UAZ API / Evolution API / Meta Cloud API |
| Scraping | httpx, BeautifulSoup, Playwright |

## O que o sistema faz

### CRM (web/)
- **Dashboard** com métricas de leilão (leads, imóveis, pipeline, conversão)
- **Pipeline Kanban** de leads (Novo → Qualificado → Negociação → Proposta → Convertido)
- **Imóveis** captados por scraping com filtros (estado, tipo, valor, ocupação)
- **Negócios** (deals) vinculando leads a imóveis específicos
- **Tarefas** e follow-ups com deadlines
- **Inbox** de atendimento com chat em tempo real (Supabase Realtime)
- **Canais** WhatsApp (QR Code via UAZAPI ou API Oficial Meta)
- Automações, campanhas, mensagens rápidas, templates
- Multi-tenant com RLS, auditoria, departamentos, tags

### Agente IA (agent/)
- Atende clientes no WhatsApp automaticamente
- Qualifica leads com scoring silencioso (quente/morno/curioso)
- Busca imóveis na base e apresenta oportunidades
- Calcula ROI/viabilidade financeira
- Transfere leads quentes pro corretor via WhatsApp
- Responde dúvidas sobre leilões (tipos, custos, riscos, legislação)

## Setup

### 1. Supabase

Crie um projeto no [supabase.com](https://supabase.com) e rode as migrations:

```bash
cd web
npx supabase db push
```

Ou cole os SQLs de `supabase/migrations/` no SQL Editor do Supabase.

### 2. Web (CRM)

```bash
cd web
cp .env.local.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Acesse `http://localhost:3000`. Sem Supabase configurado, roda em modo preview com dados mock.

### 3. Agent (IA)

```bash
cd agent
cp .env.example .env
# Preencha OPENAI_API_KEY, UAZ_BASE_URL, UAZ_TOKEN, DATABASE_URL (Supabase)
pip install -r requirements.txt
python scripts/seed_data.py   # dados de teste
uvicorn app.main:app --reload
```

### 4. Webhook WhatsApp

Configure sua instância UAZ/Evolution API pra enviar webhooks para:
```
POST https://seu-dominio.com:8000/webhook
```

## Banco de dados

### Tabelas base (mvf-atendimento)
organizations, profiles, departments, channels, contacts, conversations, messages, tags, quick_replies, wa_templates, automations, campaigns, plans, api_keys, integrations, ai_agents, audit_logs

### Tabelas de leilão (adicionadas)
**properties** — Imóveis captados por scraping ou cadastro manual
**lead_qualifications** — Qualificação de leads (score, perfil, orçamento, região)
**deals** — Negociações (lead + imóvel + valor pretendido + status)
**activities** — Timeline de eventos (qualificação, simulação, handoff, notas)
**tasks** — Follow-ups com deadlines

### View
**pipeline_overview** — Leads com qualificação + contato + contagem de deals

## Licença

Uso interno. Adapte conforme necessidade.
