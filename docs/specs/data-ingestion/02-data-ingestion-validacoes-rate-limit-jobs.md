# DATA-INGESTION - Validacoes, Rate Limit e Jobs

## DING-VAL-001 - Arquivo de importacao e obrigatorio

- Contexto de negocio:
  O pipeline ETL depende de arquivo enviado para iniciar processamento.

- Regra principal:
  Validator deve rejeitar requisicao sem arquivo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  422 com code INVALID_FILE_TYPE quando nenhum arquivo for enviado.

- Criterio de aceite:
  validateFile faz checagem de presenca de file antes das demais validacoes.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/validators/data-ingestion.validator.ts

- Status:
  implementada

## DING-VAL-002 - Somente planilha XLSX e aceita na importacao

- Contexto de negocio:
  ETL foi definido para processar layout de planilha Excel padrao.

- Regra principal:
  Validator deve aceitar apenas mimetype de arquivo XLSX.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  422 com code INVALID_FILE_TYPE para mimetype fora da whitelist.

- Criterio de aceite:
  validateFile compara file.mimetype com ALLOWED_MIMETYPES e bloqueia tipos nao suportados.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/validators/data-ingestion.validator.ts

- Status:
  implementada

## DING-VAL-003 - Limite de tamanho de upload e 50 MB

- Contexto de negocio:
  Uploads acima do limite aumentam risco de timeout e sobrecarga de processamento.

- Regra principal:
  Arquivo com tamanho maior que 50 MB deve ser rejeitado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  422 com code FILE_TOO_LARGE para arquivo acima do limite.

- Criterio de aceite:
  validateFile usa constante MAX_FILE_SIZE de 50 MB.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/validators/data-ingestion.validator.ts

- Status:
  implementada

## DING-VAL-004 - Rate limit de importacao e aplicado por propriedade

- Contexto de negocio:
  Importacao em lote precisa limite operacional para proteger ETL e API.

- Regra principal:
  Cada propriedade pode iniciar no maximo 10 importacoes por janela de 1 hora.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  429 com code RATE_LIMIT_EXCEEDED quando contador atingir limite.

- Criterio de aceite:
  checkRateLimit usa chave data-ingestion:rate:{propriedadeId}, limite 10 e TTL de 3600 segundos.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/core/cache/cache.service.ts

- Status:
  implementada

## DING-VAL-005 - Controle de acesso por propriedade usa helper central de autorizacao

- Contexto de negocio:
  Import/export deve ser restrito a propriedades associadas ao usuario autenticado.

- Regra principal:
  Validator deve consultar hasAccessToPropriedade e bloquear quando usuario nao possuir vinculo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  403 com code FORBIDDEN quando acesso for negado.

- Criterio de aceite:
  validatePropriedadeAccess chama authHelper.hasAccessToPropriedade e lanca HttpException quando falso.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## DING-VAL-006 - Contador de rate limit e consumido antes do retorno do ETL

- Contexto de negocio:
  Tentativas de importacao impactam capacidade operacional, mesmo quando o ETL retorna erro.

- Regra principal:
  No estado atual, a cota e incrementada antes da chamada remota ao ETL.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falhas de ETL tambem consomem tentativas dentro da janela de rate limit.

- Criterio de aceite:
  checkRateLimit e chamado antes de etlClient.import* nos pipelines.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/pipelines/leite.pipeline.ts
  src/modules/data-ingestion/pipelines/pesagem.pipeline.ts
  src/modules/data-ingestion/pipelines/reproducao.pipeline.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts

- Status:
  parcial

## DING-VAL-007 - Controle de concorrencia do rate limit nao e atomico

- Contexto de negocio:
  Cenarios concorrentes podem ultrapassar o limite quando operacoes de leitura e escrita nao sao atomicas.

- Regra principal:
  Implementacao atual usa sequencia get + set no cache, sem operacao atomica de incremento.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Em alta concorrencia, pode ocorrer condicao de corrida na contagem por propriedade.

- Criterio de aceite:
  checkRateLimit le valor atual com cacheService.get e depois grava novo valor com cacheService.set.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/core/cache/cache.service.ts

- Status:
  parcial

## DING-JOB-001 - Limpeza de uploads temporarios roda diariamente as 01:00

- Contexto de negocio:
  Uploads temporarios acumulados ocupam disco e devem ser removidos periodicamente.

- Regra principal:
  ScheduledIngestionJob deve executar cron diario as 01:00 para limpeza de arquivos antigos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  handleUploadCleanup usa @Cron(CronExpression.EVERY_DAY_AT_1AM).

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/jobs/scheduled-ingestion.job.ts

- Status:
  implementada

## DING-JOB-002 - Limpeza remove arquivos com mais de 24 horas

- Contexto de negocio:
  Janela de retencao de 24 horas equilibra possibilidade de reprocessamento e uso de armazenamento.

- Regra principal:
  Arquivos em temp/uploads com mtime superior a 24 horas devem ser removidos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Job usa RETENTION_MS de 24h e remove arquivo quando agora - mtimeMs excede esse valor.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/jobs/scheduled-ingestion.job.ts

- Status:
  implementada

## DING-JOB-003 - Job ignora diretorio ausente e continua processamento

- Contexto de negocio:
  Ambientes sem uploads recentes nao devem falhar por inexistencia do diretorio temporario.

- Regra principal:
  Se temp/uploads nao existir, job deve encerrar sem erro.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  handleUploadCleanup verifica fs.existsSync(UPLOAD_DIR) e retorna cedo quando falso.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/jobs/scheduled-ingestion.job.ts

- Status:
  implementada

## DING-JOB-004 - Rotina de limpeza usa APIs sincronas de filesystem

- Contexto de negocio:
  Operacoes sincronas em IO podem bloquear loop de eventos durante varreduras grandes.

- Regra principal:
  A rotina atual usa fs.readdirSync/statSync/unlinkSync para limpeza.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Em diretorios muito grandes, pode haver impacto de latencia durante execucao da rotina.

- Criterio de aceite:
  Implementacao do job utiliza chamadas sincronas do modulo fs.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/jobs/scheduled-ingestion.job.ts

- Status:
  parcial
