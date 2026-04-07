# DATA-INGESTION - Importacao e Exportacao

## DING-PIPE-001 - Fluxos de importacao sempre resolvem usuario interno antes do pipeline

- Contexto de negocio:
  Integracao ETL precisa receber usuario interno para auditoria de origem da importacao.

- Regra principal:
  DataIngestionService deve converter usuario autenticado em userId interno antes de delegar importacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException quando perfil interno nao puder ser resolvido.

- Criterio de aceite:
  importLeite, importPesagem e importReproducao chamam authHelper.getUserId(user).

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## DING-PIPE-002 - Pipeline de importacao executa validacoes em sequencia antes do ETL

- Contexto de negocio:
  Processamento remoto deve ser chamado apenas apos validar arquivo, acesso e limite operacional.

- Regra principal:
  A ordem de validacao deve ser: validateFile -> validatePropriedadeAccess -> checkRateLimit -> import ETL.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  422 para arquivo invalido, 403 para acesso negado e 429 para limite excedido.

- Criterio de aceite:
  Os tres pipelines de importacao executam as mesmas validacoes antes de chamar o cliente ETL.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/pipelines/leite.pipeline.ts
  src/modules/data-ingestion/pipelines/pesagem.pipeline.ts
  src/modules/data-ingestion/pipelines/reproducao.pipeline.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts

- Status:
  implementada

## DING-PIPE-003 - Importacao de cada dominio chama endpoint ETL especifico

- Contexto de negocio:
  Cada planilha possui semantica de negocio diferente e precisa rota especializada no ETL.

- Regra principal:
  Cliente ETL deve separar chamadas para /import/leite, /import/pesagem e /import/reproducao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falhas de rede/servico remoto propagam para pipeline com tratamento de indisponibilidade.

- Criterio de aceite:
  EtlHttpClient implementa importLeite/importPesagem/importReproducao via sendImport com path dedicado.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts

- Status:
  implementada

## DING-PIPE-004 - Integracao de importacao envia arquivo multipart e contexto de propriedade/usuario

- Contexto de negocio:
  ETL precisa receber binario da planilha e metadados de escopo para processar corretamente.

- Regra principal:
  sendImport deve enviar FormData com arquivo e query params propriedadeId e usuarioId.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem payload correto, processamento remoto nao consegue atribuir importacao ao tenant.

- Criterio de aceite:
  Chamada HTTP monta FormData com file.buffer e params com propriedadeId/usuarioId.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/etl-http-client.service.ts

- Status:
  implementada

## DING-PIPE-005 - Fluxos de exportacao geram nome padrao por dominio, propriedade e data

- Contexto de negocio:
  Downloads precisam convencao previsivel para organizacao local do operador.

- Regra principal:
  Nome do arquivo deve seguir padrao dominio_propriedade_data.xlsx.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  DataIngestionMapper.buildExportFileName compoe nome usando dominio, propriedadeId e data ISO do dia.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/mappers/data-ingestion.mapper.ts
  src/modules/data-ingestion/pipelines/leite.pipeline.ts
  src/modules/data-ingestion/pipelines/pesagem.pipeline.ts
  src/modules/data-ingestion/pipelines/reproducao.pipeline.ts

- Status:
  implementada

## DING-PIPE-006 - Exportacao valida acesso por propriedade antes de chamar ETL

- Contexto de negocio:
  Planilhas exportadas podem conter dados sensiveis de producao e reproducao da propriedade.

- Regra principal:
  Export deve validar ownership por propriedade antes da chamada remota.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  403 para acesso negado.

- Criterio de aceite:
  DataIngestionService.exportLeite/exportPesagem/exportReproducao chamam validator.validatePropriedadeAccess.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts

- Status:
  implementada

## DING-PIPE-007 - Exportacao usa filtros opcionais por dominio e retorna binario XLSX

- Contexto de negocio:
  Operacao precisa filtrar dados por grupo, periodo e atributos especificos antes do download.

- Regra principal:
  Controller deve mapear query params para ExportFiltersDto e devolver buffer com headers de planilha.

- Excecoes:
  Filtros sao opcionais.

- Erros esperados:
  503 em indisponibilidade do ETL.

- Criterio de aceite:
  Controller monta filters via mapper, chama service.export* e define Content-Type/Content-Disposition/Content-Length.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/data-ingestion/mappers/data-ingestion.mapper.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts

- Status:
  implementada

## DING-PIPE-008 - Falhas inesperadas de pipeline sao normalizadas para ETL_UNAVAILABLE

- Contexto de negocio:
  API precisa contrato consistente para indisponibilidade externa do ETL.

- Regra principal:
  Erros nao HttpException devem ser convertidos para HttpException 503 com code ETL_UNAVAILABLE.

- Excecoes:
  HttpException original e reaproveitada sem conversao.

- Erros esperados:
  503 com mensagem de indisponibilidade.

- Criterio de aceite:
  Pipelines de import/export e DataIngestionService.getJobStatus fazem fallback para HttpStatus.SERVICE_UNAVAILABLE.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/pipelines/leite.pipeline.ts
  src/modules/data-ingestion/pipelines/pesagem.pipeline.ts
  src/modules/data-ingestion/pipelines/reproducao.pipeline.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts

- Status:
  implementada

## DING-PIPE-009 - Consulta de status de job depende apenas de jobId

- Contexto de negocio:
  Status assicrono permite acompanhar progresso de importacoes longas.

- Regra principal:
  API deve encaminhar jobId para o ETL e retornar status, progresso e resultado do processamento.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  503 em indisponibilidade do ETL.

- Criterio de aceite:
  DataIngestionJobController chama service.getJobStatus(jobId), que delega para etlClient.getJobStatus(jobId).

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/modules/data-ingestion/services/etl-http-client.service.ts
  src/modules/data-ingestion/interfaces/etl-client.interface.ts

- Status:
  implementada
