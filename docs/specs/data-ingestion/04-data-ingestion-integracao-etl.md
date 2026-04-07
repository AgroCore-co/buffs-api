# DATA-INGESTION - Integracao com ETL

## DING-ETL-001 - Configuracao critica do client ETL e fail-fast no bootstrap

- Contexto de negocio:
  Sem endpoint e chave interna, ingestao nao pode operar com seguranca.

- Regra principal:
  EtlHttpClient deve exigir ETL_BASE_URL e ETL_INTERNAL_KEY no construtor.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erro de inicializacao quando variaveis obrigatorias nao estiverem definidas.

- Criterio de aceite:
  Client usa configService.getOrThrow para ambas as configuracoes.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts

- Status:
  implementada

## DING-ETL-002 - Autenticacao tecnica com ETL usa cabecalho interno

- Contexto de negocio:
  API ETL interna deve aceitar chamadas apenas de origem autorizada.

- Regra principal:
  Todas as chamadas ao ETL devem incluir header X-Internal-Key.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ETL pode rejeitar requests sem chave valida.

- Criterio de aceite:
  buildHeaders retorna X-Internal-Key e e aplicado em import, export e status de job.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts

- Status:
  implementada

## DING-ETL-003 - Timeout de importacao e maior que timeout de exportacao

- Contexto de negocio:
  Processamento de importacao tende a ser mais custoso que geracao de export.

- Regra principal:
  Importacoes devem usar timeout de 120s e exportacoes timeout de 60s.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Timeout em chamadas longas para ETL.

- Criterio de aceite:
  sendImport usa timeout 120_000 e sendExport usa timeout 60_000.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts
  src/modules/data-ingestion/data-ingestion.module.ts

- Status:
  implementada

## DING-ETL-004 - Exportacao solicita resposta binaria para montagem de arquivo local

- Contexto de negocio:
  Download de planilha exige buffer bruto em vez de JSON.

- Regra principal:
  Requisicao de export deve usar responseType arraybuffer e converter retorno para Buffer.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem responseType binario, resposta pode ser interpretada incorretamente.

- Criterio de aceite:
  sendExport usa responseType: arraybuffer e retorna Buffer.from(response.data).

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts

- Status:
  implementada

## DING-ETL-005 - Status de job e consultado em endpoint dedicado do ETL

- Contexto de negocio:
  Monitoramento assicrono depende de endpoint separado de import/export.

- Regra principal:
  Cliente deve consultar GET /jobs/:jobId no ETL.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Em indisponibilidade remota, service converte para erro de servico indisponivel.

- Criterio de aceite:
  getJobStatus no client faz GET para baseUrl/jobs/{jobId}.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts

- Status:
  implementada

## DING-ETL-006 - Integracao nao implementa retry ou backoff automatico

- Contexto de negocio:
  Falhas transientes de rede podem ser recuperaveis com politicas de nova tentativa.

- Regra principal:
  No estado atual, chamadas ao ETL sao tentativa unica por requisicao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha transiente retorna erro imediato ao cliente, sem reexecucao automatica.

- Criterio de aceite:
  EtlHttpClient usa chamadas HTTP diretas sem estrategia de retry/backoff/circuit breaker.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts

- Status:
  parcial
