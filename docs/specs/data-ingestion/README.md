# DATA-INGESTION - Indice de Especificacoes

Este diretorio contem as regras do modulo de ingestao e exportacao de dados via ETL.

Documentos:

- 00-data-ingestion-visao-geral.md
- 01-data-ingestion-importacao-exportacao.md
- 02-data-ingestion-validacoes-rate-limit-jobs.md
- 03-data-ingestion-dtos-contratos.md
- 04-data-ingestion-integracao-etl.md
- 05-data-ingestion-core-integracao.md

Escopo coberto:

- Arquitetura do modulo e fronteiras entre controller, service, pipelines, validator, mapper e job agendado.
- Regras de importacao e exportacao para leite, pesagem e reproducao.
- Validacoes de arquivo, controle de acesso por propriedade, rate limit e limpeza de uploads temporarios.
- Contratos DTO/interface de request e response para processamento e status de jobs.
- Integracao externa com servico ETL e integracao interna com recursos compartilhados do Core.
