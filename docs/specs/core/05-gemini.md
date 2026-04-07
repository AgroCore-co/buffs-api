# CORE - Gemini

## CORE-GEMINI-001 - Chave obrigatoria para classificacao de alertas

- Contexto de negocio:
  Classificacao de prioridade usa IA como parte do fluxo de alertas.

- Regra principal:
  GEMINI_API_KEY deve existir na inicializacao do GeminiService.

- Excecoes:
  Sem excecoes no ambiente principal.

- Erros esperados:
  Erro de inicializacao quando chave estiver ausente.

- Criterio de aceite:
  Sem chave, provider de Gemini nao e inicializado.

- Rastreabilidade para codigo e testes:
  src/core/gemini/gemini.service.ts

- Status:
  implementada

## CORE-GEMINI-002 - Saida de classificacao restrita ao dominio

- Contexto de negocio:
  Alerta so aceita prioridades BAIXA, MEDIA ou ALTA.

- Regra principal:
  Resposta da IA fora do conjunto permitido deve ser tratada como indisponibilidade de servico.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ServiceUnavailableException quando resposta for vazia/invalida.

- Criterio de aceite:
  Metodo retorna apenas BAIXA, MEDIA ou ALTA, ou levanta erro controlado.

- Rastreabilidade para codigo e testes:
  src/core/gemini/gemini.service.ts

- Status:
  implementada

## CORE-GEMINI-003 - Tratamento robusto de falhas externas

- Contexto de negocio:
  Dependencia externa de IA pode sofrer timeout, erro de rede ou erro de API.

- Regra principal:
  Falhas externas devem gerar log detalhado e erro de servico indisponivel para o dominio.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  ServiceUnavailableException em cenarios de erro remoto.

- Criterio de aceite:
  Erros Axios e outros erros sao normalizados para resposta de indisponibilidade.

- Rastreabilidade para codigo e testes:
  src/core/gemini/gemini.service.ts
  src/modules/alerta/consumers/alertas.consumer.ts

- Status:
  implementada
