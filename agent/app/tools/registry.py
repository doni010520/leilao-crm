"""
Tool registry for the auction agent.
Defines OpenAI function-calling schemas for all agent capabilities.
"""

TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "buscar_imoveis",
            "description": "Busca imóveis de leilão na base de dados. Use quando o cliente quer ver oportunidades.",
            "parameters": {
                "type": "object",
                "properties": {
                    "estado": {
                        "type": "string",
                        "description": "Sigla do estado (ex: SP, RJ, MG). Obrigatório.",
                    },
                    "cidade": {
                        "type": "string",
                        "description": "Nome da cidade (ex: São Paulo, Rio de Janeiro). Opcional.",
                    },
                    "tipo_imovel": {
                        "type": "string",
                        "enum": ["apartamento", "casa", "terreno", "comercial", "rural"],
                        "description": "Tipo do imóvel. Opcional.",
                    },
                    "valor_max": {
                        "type": "number",
                        "description": "Valor máximo do lance mínimo em reais. Opcional.",
                    },
                    "valor_min": {
                        "type": "number",
                        "description": "Valor mínimo do lance mínimo em reais. Opcional.",
                    },
                    "limite": {
                        "type": "integer",
                        "description": "Quantidade máxima de resultados. Padrão: 3.",
                    },
                },
                "required": ["estado"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "simular_roi",
            "description": "Calcula viabilidade financeira de um imóvel de leilão: custo total, margem de lucro e payback. Use quando o cliente quer saber se vale a pena.",
            "parameters": {
                "type": "object",
                "properties": {
                    "valor_lance": {
                        "type": "number",
                        "description": "Valor do lance pretendido em reais.",
                    },
                    "valor_mercado": {
                        "type": "number",
                        "description": "Valor estimado de mercado do imóvel em reais.",
                    },
                    "custo_reforma": {
                        "type": "number",
                        "description": "Custo estimado de reforma em reais. 0 se não precisar.",
                    },
                    "divida_condominio": {
                        "type": "number",
                        "description": "Dívida de condomínio conhecida em reais. 0 se não houver.",
                    },
                    "finalidade": {
                        "type": "string",
                        "enum": ["revenda", "aluguel"],
                        "description": "Objetivo: revender (flip) ou alugar.",
                    },
                    "aluguel_mensal": {
                        "type": "number",
                        "description": "Aluguel mensal estimado (só se finalidade=aluguel).",
                    },
                },
                "required": ["valor_lance", "valor_mercado", "finalidade"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "qualificar_lead",
            "description": "Salva a qualificação do lead com score e perfil. Use após coletar dados suficientes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "perfil": {
                        "type": "string",
                        "enum": [
                            "investidor_experiente",
                            "iniciante",
                            "casa_propria",
                            "flipper",
                            "renteiro",
                            "nao_definido",
                        ],
                        "description": "Perfil do lead.",
                    },
                    "score": {
                        "type": "integer",
                        "description": "Score calculado (soma dos pontos de qualificação, de -8 a +18).",
                    },
                    "objetivo": {
                        "type": "string",
                        "description": "Objetivo do lead: morar, investir, revender, alugar, entender.",
                    },
                    "regiao": {
                        "type": "string",
                        "description": "Região de interesse.",
                    },
                    "faixa_valor_min": {
                        "type": "number",
                        "description": "Faixa de valor mínimo.",
                    },
                    "faixa_valor_max": {
                        "type": "number",
                        "description": "Faixa de valor máximo.",
                    },
                    "forma_pagamento": {
                        "type": "string",
                        "enum": ["avista", "financiamento", "nao_definido"],
                        "description": "Forma de pagamento pretendida.",
                    },
                    "capital_disponivel": {
                        "type": "boolean",
                        "description": "Se tem capital/crédito disponível.",
                    },
                    "prazo": {
                        "type": "string",
                        "enum": ["imediato", "30dias", "60dias", "sem_prazo"],
                        "description": "Prazo pretendido para compra.",
                    },
                    "ja_arrematou": {
                        "type": "boolean",
                        "description": "Se já participou/arrematou em leilão antes.",
                    },
                },
                "required": ["perfil", "score", "objetivo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "transferir_corretor",
            "description": "Transfere o lead qualificado para um corretor humano com resumo completo. Use quando o lead está quente (score 12+).",
            "parameters": {
                "type": "object",
                "properties": {
                    "resumo": {
                        "type": "string",
                        "description": "Resumo completo do lead: perfil, orçamento, região, urgência, interesses.",
                    },
                    "urgencia": {
                        "type": "string",
                        "enum": ["alta", "media", "baixa"],
                        "description": "Urgência do atendimento.",
                    },
                },
                "required": ["resumo", "urgencia"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "registrar_interesse",
            "description": "Registra o interesse de um lead em um imóvel específico.",
            "parameters": {
                "type": "object",
                "properties": {
                    "property_id": {
                        "type": "integer",
                        "description": "ID do imóvel na base.",
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["visualizou", "pediu_simulacao", "interessado"],
                        "description": "Tipo de interesse.",
                    },
                },
                "required": ["property_id", "tipo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_human",
            "description": "Transfere para atendimento humano quando o agente não consegue resolver.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Motivo da transferência.",
                    }
                },
                "required": ["reason"],
            },
        },
    },
]
