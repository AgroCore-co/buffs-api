# DASHBOARD - Stats Gerais

## DASH-STATS-001 - Estatisticas principais executam consultas em paralelo

- Contexto de negocio:
  Dashboard inicial precisa responder rapido com varios indicadores agregados.

- Regra principal:
  getStats deve buscar dados base em paralelo (bufalos, bufalas lactando, lotes, usuarios) para reduzir tempo total.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException quando qualquer consulta critica falhar.

- Criterio de aceite:
  Service usa Promise.all para as consultas base de stats.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts
  src/modules/dashboard/repositories/dashboard.repository.drizzle.ts

- Status:
  implementada

## DASH-STATS-002 - Contagens por sexo/maturidade consideram apenas animais ativos

- Contexto de negocio:
  Indicador operacional deve refletir rebanho ativo, nao historico completo.

- Regra principal:
  Quantidades por sexo e nivel de maturidade devem ser calculadas sobre bufalos com status true.

- Excecoes:
  qtd_bufalos_registradas representa total geral retornado pela consulta, incluindo inativos.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Campos qtd_macho_ativos, qtd_femeas_ativas e contagens de maturidade usam filtro de ativos.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts

- Status:
  implementada

## DASH-STATS-003 - Ranking de racas ordenado por quantidade decrescente

- Contexto de negocio:
  Gestao de rebanho precisa visualizar composicao racial de forma priorizada.

- Regra principal:
  Lista bufalosPorRaca deve agrupar por nome da raca e ordenar por quantidade desc.

- Excecoes:
  Animais sem raca devem ser agrupados como "Sem Raca".

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Resultado final retorna array agrupado por raca e ordenado da maior para a menor contagem.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts
  src/modules/dashboard/dto/dashboard-stats.dto.ts

- Status:
  implementada
