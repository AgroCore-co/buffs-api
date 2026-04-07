# DASHBOARD - Producao Mensal

## DASH-PROD-001 - Agregacao mensal de ordenhas por ano de referencia

- Contexto de negocio:
  Acompanhamento de tendencia produtiva exige consolidacao por mes.

- Regra principal:
  Service deve buscar ordenhas no intervalo anual e agrupar por YYYY-MM, consolidando total de litros, bufalas unicas e dias com ordenha.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException quando falhar consulta/processamento.

- Criterio de aceite:
  serie_historica retorna totais mensais com media_diaria calculada por dias com ordenha.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts
  src/modules/dashboard/repositories/dashboard.repository.drizzle.ts
  src/modules/dashboard/dto/dashboard-producao-mensal.dto.ts

- Status:
  implementada

## DASH-PROD-002 - Serie historica deve conter 12 meses

- Contexto de negocio:
  Frontend de grafico anual precisa sempre da serie completa, mesmo em meses sem producao.

- Regra principal:
  Resposta deve preencher todos os 12 meses do ano com zero quando nao houver dados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  serie_historica tem 12 itens para o ano solicitado.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts

- Status:
  implementada

## DASH-PROD-003 - Variacao percentual compara mes atual de referencia com mes anterior

- Contexto de negocio:
  Indicador de variacao mensal orienta decisao de manejo e desempenho.

- Regra principal:
  variacao_percentual deve ser calculada por ((mes_atual - mes_anterior) / mes_anterior) * 100, com fallback para 0 quando mes anterior for zero.

- Excecoes:
  Quando nao houver dados no ano, mes de referencia atual segue mes corrente se ano atual, senao dezembro.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Resposta contem mes_atual_litros, mes_anterior_litros e variacao_percentual coerentes com formula.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts

- Status:
  implementada

## DASH-PROD-004 - Cobertura de testes automatizados do modulo

- Contexto de negocio:
  Regras de agregacao possuem complexidade e risco de regressao.

- Regra principal:
  Modulo deveria possuir testes unitarios/e2e especificos para cenarios de agregacao e variacao mensal.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao foram encontrados testes dedicados em test/ para dashboard no estado atual.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts
  test/

- Status:
  parcial
