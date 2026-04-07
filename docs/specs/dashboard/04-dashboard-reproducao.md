# DASHBOARD - Reproducao

## DASH-REPRO-001 - Totais por status de reproducao

- Contexto de negocio:
  Gestao reprodutiva depende de visao rapida por estagio do ciclo.

- Regra principal:
  Service deve contabilizar total de reproducoes por status: Em andamento, Confirmada e Falha.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falha de consulta/processamento.

- Criterio de aceite:
  Resposta retorna os tres totais em campos separados.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts
  src/modules/dashboard/repositories/dashboard.repository.drizzle.ts
  src/modules/dashboard/dto/dashboard-reproducao.dto.ts

- Status:
  implementada

## DASH-REPRO-002 - Ultima data de reproducao

- Contexto de negocio:
  Indicador de recencia facilita acompanhamento de atividade reprodutiva recente.

- Regra principal:
  ultimaDataReproducao deve refletir o dtEvento mais recente formatado como data simples.

- Excecoes:
  Se nao houver registros, ultimaDataReproducao deve ser null.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Consulta ordena por dtEvento decrescente e service retorna primeiro item quando existir.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/repositories/dashboard.repository.drizzle.ts
  src/modules/dashboard/dashboard.service.ts

- Status:
  implementada
