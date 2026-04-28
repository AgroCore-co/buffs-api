# REBANHO - Visao Geral

## REB-ARCH-001 - Modulo rebanho compoe quatro subdominios especializados

- Contexto de negocio:
  A operacao pecuaria exige separar cadastro de animais, estruturas de agrupamento e historico de movimentacao fisica.

- Regra principal:
  RebanhoModule deve compor BufaloModule, GrupoModule, RacaModule e MovLoteModule como blocos funcionais do dominio.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI se submodulos nao forem importados/exportados corretamente.

- Criterio de aceite:
  RebanhoModule importa e exporta os quatro submodulos.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/rebanho.module.ts

- Status:
  implementada

## REB-ARCH-002 - Submodulos seguem separacao de responsabilidade por fronteira de dominio

- Contexto de negocio:
  Regras de bufalo, grupo/raca e movimentacao evoluem em ritmos diferentes e possuem riscos distintos.

- Regra principal:
  Cada submodulo deve concentrar controller, service, repositorio e DTOs do seu proprio contexto, com orquestracao no modulo raiz.

- Excecoes:
  BufaloModule integra GenealogiaModule por dependencia direta de calculo de categoria ABCB.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Estrutura de diretorios do modulo rebanho esta segregada por subdominio e providers dedicados.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/
  src/modules/rebanho/grupo/
  src/modules/rebanho/raca/
  src/modules/rebanho/mov-lote/

- Status:
  implementada

## REB-ARCH-003 - Endpoints de rebanho exigem autenticacao JWT

- Contexto de negocio:
  Dados de animais, grupos e movimentacao nao podem ser expostos anonimamente.

- Regra principal:
  Controllers do modulo devem aplicar SupabaseAuthGuard para restringir acesso a usuarios autenticados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 quando token estiver ausente, invalido ou expirado.

- Criterio de aceite:
  BufaloController, GrupoController, RacaController e MovLoteController estao anotados com @UseGuards(SupabaseAuthGuard).

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.controller.ts
  src/modules/rebanho/grupo/grupo.controller.ts
  src/modules/rebanho/raca/raca.controller.ts
  src/modules/rebanho/mov-lote/mov-lote.controller.ts
  src/modules/auth/guards/auth.guard.ts

- Status:
  implementada

## REB-ARCH-004 - Maturidade de bufalos tem atualizacao automatica diaria

- Contexto de negocio:
  A classificacao etaria muda ao longo do tempo e deve ser atualizada sem depender de acao manual.

- Regra principal:
  BufaloScheduler deve executar job diario para atualizar maturidade de animais ativos, com protecao contra execucoes concorrentes locais e distribuidas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falhas no job devem ser logadas sem travar execucoes futuras.

- Criterio de aceite:
  Job usa cron diario, flag isRunning, lock distribuido via advisory lock no PostgreSQL, busca animais ativos e executa atualizacao por lote.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.scheduler.ts
  src/modules/rebanho/bufalo/bufalo.scheduler.spec.ts

- Status:
  implementada
