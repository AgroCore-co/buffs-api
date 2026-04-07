# CORE - Visao Geral

## CORE-ARCH-001 - CoreModule global e exportavel

- Contexto de negocio:
  Modulos de dominio dependem de servicos compartilhados e precisam evitar duplicacao de configuracao.

- Regra principal:
  O Core deve ser global e exportar os modulos/servicos base para consumo transversal.

- Excecoes:
  Sem excecoes previstas no estado atual.

- Erros esperados:
  Falha de injecao de dependencia quando um provider do Core nao estiver exportado.

- Criterio de aceite:
  Qualquer modulo de negocio consegue injetar servicos do Core sem importar cada provider individual.

- Rastreabilidade para codigo e testes:
  src/core/core.module.ts

- Status:
  implementada

## CORE-ARCH-002 - Fail-fast de configuracoes criticas

- Contexto de negocio:
  Inicializar a API sem credenciais essenciais causa falhas tardias e comportamentos inconsistentes.

- Regra principal:
  A inicializacao deve falhar imediatamente quando variaveis criticas nao estiverem presentes.

- Excecoes:
  Sem excecoes funcionais para ambiente de execucao normal.

- Erros esperados:
  Erro de inicializacao com mensagem explicita para variavel ausente.

- Criterio de aceite:
  Sem DATABASE_URL, SUPABASE_URL/SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY ou GEMINI_API_KEY, a app nao sobe.

- Rastreabilidade para codigo e testes:
  src/core/database/database.service.ts
  src/core/supabase/supabase.service.ts
  src/core/gemini/gemini.service.ts

- Status:
  implementada

## CORE-ARCH-003 - Aplicacao hibrida com microservico RMQ

- Contexto de negocio:
  O modulo de alertas depende de fluxo assincrono para desacoplamento e resiliencia.

- Regra principal:
  A API HTTP deve conectar microservico RMQ com ack manual e controle de prefetch.

- Excecoes:
  Sem excecao no bootstrap principal.

- Erros esperados:
  Mensagens podem ir para DLQ quando houver nack sem requeue.

- Criterio de aceite:
  Microservico conecta na fila de alertas com noAck false e prefetchCount 1.

- Rastreabilidade para codigo e testes:
  src/main.ts

- Status:
  implementada
