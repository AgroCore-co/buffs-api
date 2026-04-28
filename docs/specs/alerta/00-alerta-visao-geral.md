# ALERTA - Visao Geral

## ALERTA-ARCH-001 - Modulo centraliza cinco nichos de monitoramento zootecnico

- Contexto de negocio:
  O sistema de alertas precisa cobrir sinais clinicos, agenda sanitaria, ciclo reprodutivo, manejo pre-parto e oscilacoes de producao.

- Regra principal:
  AlertasProvidersModule deve registrar servicos de dominio para CLINICO, SANITARIO, REPRODUCAO, MANEJO e PRODUCAO, exportando-os para o modulo HTTP e para o modulo de consumer.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI se algum servico de nicho nao for provido no modulo de providers.

- Criterio de aceite:
  AlertasProvidersModule expoe AlertaClinicoService, AlertaSanitarioService, AlertaReproducaoService, AlertaManejoService e AlertaProducaoService, e os modulos AlertasModule/AlertsConsumerModule importam esse modulo.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.providers.module.ts
  src/modules/alerta/alerta.module.ts
  src/modules/alerta/consumers/alerts-consumer.module.ts

- Status:
  implementada

## ALERTA-ARCH-002 - API de alertas e protegida por autenticacao

- Contexto de negocio:
  Alertas carregam dados sensiveis de saude, reproducao e producao e nao podem ser acessados sem identidade autenticada.

- Regra principal:
  AlertasController deve aplicar SupabaseAuthGuard em todos os endpoints.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token ausente, invalido ou expirado.

- Criterio de aceite:
  O controller usa @UseGuards(SupabaseAuthGuard) no escopo da classe.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts
  src/modules/auth/guards/auth.guard.ts

- Status:
  implementada

## ALERTA-ARCH-003 - Geracao de alertas combina fluxo manual e fluxo automatico

- Contexto de negocio:
  O negocio precisa tanto de criacao manual por API quanto de verificacao periodica baseada em dados operacionais.

- Regra principal:
  O modulo deve suportar POST /alertas para criacao direta e POST /alertas/verificar/:id_propriedade para processamento por nicho.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para payload invalido e 500 para falhas de processamento/persistencia.

- Criterio de aceite:
  O controller expoe os dois endpoints e delega verificacao para AlertasVerificacaoService.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts
  src/modules/alerta/services/alertas-verificacao.service.ts

- Status:
  implementada

## ALERTA-ARCH-004 - Schedulers processam alertas por propriedade ativa

- Contexto de negocio:
  A operacao e multi-tenant por propriedade; cada propriedade ativa precisa de verificacao independente para evitar contagem cruzada de alertas.

- Regra principal:
  AlertasScheduler deve buscar propriedades ativas e executar verificacoes por id_propriedade em cada job.

- Excecoes:
  Se nao houver propriedade ativa, jobs finalizam sem criacao.

- Erros esperados:
  Falhas de uma propriedade devem ser registradas e nao interromper o loop das demais.

- Criterio de aceite:
  Scheduler consulta propriedade sem deletedAt e invoca callbacks de nicho por propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.scheduler.ts
  src/database/schema.ts

- Status:
  implementada

## ALERTA-ARCH-005 - Persistencia de alerta usa delete fisico

- Contexto de negocio:
  O usuario pode limpar alertas ja tratados sem manter historico dentro da tabela principal.

- Regra principal:
  A remocao de alerta deve executar delete fisico apos validar existencia.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  404 quando o alerta nao existe; 500 em falha de banco.

- Criterio de aceite:
  AlertasService chama findOne antes de remove e o repository executa db.delete(alertas).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts

- Status:
  implementada

## ALERTA-ARCH-006 - Validacao de ownership por propriedade e explicita no modulo

- Contexto de negocio:
  Em ambiente multi-tenant, autenticacao isolada nao garante por si so que o usuario tenha vinculo com a propriedade consultada.

- Regra principal:
  Endpoints por propriedade devem validar ownership com helper central do Core antes de listar/processar alertas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  404 quando o usuario nao possui vinculo com a propriedade consultada/processada.

- Criterio de aceite:
  Os fluxos findByPropriedade e verificarAlertas chamam validatePropertyAccess, que usa AuthHelperService.getUserId e AuthHelperService.validatePropriedadeAccess.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## ALERTA-ARCH-007 - Nao ha cobertura automatizada dedicada para o modulo

- Contexto de negocio:
  Regras de alerta afetam acao diaria da fazenda e precisam regressao automatizada para evitar drift funcional.

- Regra principal:
  O modulo deveria ter testes unitarios/e2e proprios para idempotencia, scheduler e consumer.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Maior risco de regressao silenciosa em thresholds e deduplicacao.

- Criterio de aceite:
  Nao existem arquivos de teste especificos do modulo alerta no estado atual.

- Rastreabilidade para codigo e testes:
  src/modules/alerta
  test/app.e2e-spec.ts
  test/rebanho.e2e-spec.ts

- Status:
  parcial
