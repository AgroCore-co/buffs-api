# DASHBOARD - Lactacao

## DASH-LACT-001 - Metricas de lactacao sao calculadas por propriedade e ano

- Contexto de negocio:
  Comparacao de desempenho lactacional depende de janela temporal anual.

- Regra principal:
  Endpoint de lactacao deve aceitar ano opcional e usar ano atual como default quando ausente.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falha de processamento.

- Criterio de aceite:
  Service recebe ano informado ou currentYear quando query nao existir.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts
  src/modules/dashboard/dashboard.service.ts

- Status:
  implementada

## DASH-LACT-002 - Base de calculo considera apenas ciclos encerrados de femeas

- Contexto de negocio:
  Classificacao de desempenho depende de ciclo completo e comparavel.

- Regra principal:
  Consulta base deve incluir apenas ciclos com dtSecagemReal preenchida, do ano de referencia, e animais de sexo F.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  InternalServerErrorException em erro de query.

- Criterio de aceite:
  Repository aplica filtros de ano, secagem real nao nula e sexo feminino.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/repositories/dashboard.repository.drizzle.ts

- Status:
  implementada

## DASH-LACT-003 - Classificacao relativa a media do rebanho

- Contexto de negocio:
  Meta de desempenho deve ser relativa ao contexto da propriedade/ano.

- Regra principal:
  Cada ciclo deve ser classificado por lactacao_total comparada a media do rebanho anual:
  - Otima: >= 120% da media
  - Boa: >= 100% da media
  - Mediana: >= 80% da media
  - Ruim: < 80% da media

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Resposta retorna media_rebanho_ano e ciclos com classificacao preenchida e ordenada por classe/desempenho.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts
  src/modules/dashboard/dto/dashboard-lactacao.dto.ts

- Status:
  implementada

## DASH-LACT-004 - Numero de parto e derivado da ordem cronologica por bufala

- Contexto de negocio:
  Indicador por parto depende da sequencia historica da bufala.

- Regra principal:
  numero_parto deve ser derivado pela ordenacao crescente de dtParto para cada bufala.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Ciclos de uma mesma bufala recebem indice incremental a partir de 1.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts

- Status:
  implementada
