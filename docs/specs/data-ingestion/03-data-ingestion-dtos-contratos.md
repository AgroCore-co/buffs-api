# DATA-INGESTION - DTOs e Contratos

## DING-DTO-001 - ExportFiltersDto define contrato de filtros por propriedade

- Contexto de negocio:
  Exportacoes precisam filtros consistentes para reduzir volume e focar periodo/grupo relevante.

- Regra principal:
  ExportFiltersDto deve exigir propriedadeId e aceitar filtros opcionais por grupo, maturidade, sexo, tipo e intervalo de datas.

- Excecoes:
  Filtros opcionais podem ser omitidos.

- Erros esperados:
  Em validacao formal, valores fora de enum/formato devem gerar erro de contrato.

- Criterio de aceite:
  DTO declara validacoes de UUID, enum e data para campos previstos.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/dto/export-filters.dto.ts

- Status:
  implementada

## DING-DTO-002 - ImportResponseDto padroniza retorno de processamento de planilha

- Contexto de negocio:
  Frontend e operadores precisam resumo padrao com contagem de linhas importadas, puladas e inconsistencias.

- Regra principal:
  Resposta de importacao deve incluir totalRows, imported, skipped, errors e warnings, com jobId opcional.

- Excecoes:
  jobId pode ser omitido quando processamento nao for assicrono.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  DTO de resposta inclui colecoes tipadas de EtlRowErrorDto e EtlRowWarningDto.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/dto/import-response.dto.ts

- Status:
  implementada

## DING-DTO-003 - JobStatusResponseDto padroniza monitoramento assicrono

- Contexto de negocio:
  Acompanhamento de importacoes longas requer status e progresso com estrutura previsivel.

- Regra principal:
  Contrato de status deve conter jobId, status, progress, resultado opcional e timestamps.

- Excecoes:
  result e opcional ate o termino do processamento.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  DTO restringe status ao conjunto pending, processing, done e failed.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/dto/import-response.dto.ts

- Status:
  implementada

## DING-DTO-004 - Interface IEtlClient define contrato unico para adapter de ETL

- Contexto de negocio:
  Service e pipelines precisam depender de contrato estavel, sem acoplamento ao transporte HTTP.

- Regra principal:
  Interface deve cobrir importacoes, exportacoes e consulta de status de job para os tres dominios.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando provider nao implementa o contrato esperado.

- Criterio de aceite:
  IEtlClient declara metodos importLeite/importPesagem/importReproducao/exportLeite/exportPesagem/exportReproducao/getJobStatus.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/interfaces/etl-client.interface.ts
  src/modules/data-ingestion/data-ingestion.module.ts

- Status:
  implementada

## DING-DTO-005 - ImportRequestDto existe, mas nao e usado no fluxo HTTP atual

- Contexto de negocio:
  Contratos nao usados tendem a gerar documentacao redundante e manutencao desnecessaria.

- Regra principal:
  No desenho atual, propriedadeId vem do parametro de rota e nao de body DTO para importacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Controller de importacao recebe propriedadeId por @Param e nao usa ImportRequestDto como payload.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/dto/import-request.dto.ts
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts

- Status:
  parcial

## DING-DTO-006 - Validacoes declaradas em ExportFiltersDto nao sao aplicadas automaticamente na rota

- Contexto de negocio:
  Validacao de query protege o ETL contra parametros invalidos e reduz erro operacional.

- Regra principal:
  Endpoint deveria receber ExportFiltersDto diretamente com ValidationPipe para validar query params.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, valores de query podem entrar sem validacao class-validator antes da chamada ao ETL.

- Criterio de aceite:
  Controller recebe querys como strings soltas e mapper instancia ExportFiltersDto manualmente sem disparar validacao de classe.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/data-ingestion/mappers/data-ingestion.mapper.ts
  src/modules/data-ingestion/dto/export-filters.dto.ts

- Status:
  parcial

## DING-DTO-007 - Contrato de status permite Date enquanto transporte HTTP retorna serializacao textual

- Contexto de negocio:
  Consumidores HTTP frequentemente recebem datas serializadas em string ISO, exigindo alinhamento de contrato.

- Regra principal:
  No contrato atual, createdAt e updatedAt estao tipados como Date no DTO/interface.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Clientes podem precisar converter string para Date ao consumir resposta HTTP.

- Criterio de aceite:
  EtlJobStatus e JobStatusResponseDto usam tipo Date para timestamps.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/interfaces/etl-client.interface.ts
  src/modules/data-ingestion/dto/import-response.dto.ts

- Status:
  parcial
