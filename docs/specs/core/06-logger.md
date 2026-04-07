# CORE - Logger

## CORE-LOG-001 - Log estruturado com timestamp e contexto

- Contexto de negocio:
  Diagnostico operacional depende de correlacao por modulo/metodo/usuario.

- Regra principal:
  Logs devem incluir timestamp ISO e contexto serializado quando informado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel como erro de dominio.

- Criterio de aceite:
  Mensagens de log apresentam formato padrao com contexto opcional.

- Rastreabilidade para codigo e testes:
  src/core/logger/logger.service.ts

- Status:
  implementada

## CORE-LOG-002 - Debug e verbose apenas em desenvolvimento

- Contexto de negocio:
  Reduzir ruido e custo de log em producao.

- Regra principal:
  Metodos debug e verbose so devem emitir saida quando NODE_ENV for development.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Em producao, chamadas debug/verbose nao imprimem log.

- Rastreabilidade para codigo e testes:
  src/core/logger/logger.service.ts

- Status:
  implementada

## CORE-LOG-003 - logError preserva stack quando disponivel

- Contexto de negocio:
  Investigacao de incidentes precisa manter contexto completo da excecao.

- Regra principal:
  logError deve registrar mensagem do erro e stack trace quando existir.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Erros capturados passam por logError com stack repassada para saida.

- Rastreabilidade para codigo e testes:
  src/core/logger/logger.service.ts

- Status:
  implementada
