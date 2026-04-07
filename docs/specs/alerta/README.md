# ALERTA - Indice de Especificacoes

Este diretorio contem as regras do modulo de alertas.

Documentos:

- 00-alerta-visao-geral.md
- 01-alerta-criacao-listagem-idempotencia.md
- 02-alerta-schedulers-verificacoes.md
- 03-alerta-consumer-classificacao-ia.md
- 04-alerta-dtos-validacoes.md
- 05-alerta-core-integracao.md

Escopo coberto:

- Arquitetura do modulo, nichos de negocio e fronteiras entre controller, service, scheduler, consumer e repositories.
- Regras de criacao, idempotencia, listagem paginada e ciclo de visualizacao/remocao de alertas.
- Verificacoes automaticas por propriedade para os nichos clinico, sanitario, reproducao, manejo e producao.
- Classificacao de prioridade orientada por IA via RabbitMQ + Gemini.
- Contratos de entrada (DTOs), validacoes e pontos de integracao com o Core (auth, database, cache, paginacao, utilitarios e mensageria).
