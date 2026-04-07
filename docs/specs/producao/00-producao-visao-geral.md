# PRODUCAO - Visao Geral

## PROD-ARCH-001 - Modulo raiz compoe seis subdominios de producao

- Contexto de negocio:
  O dominio de producao foi separado em blocos operacionais para registrar ciclo, ordenha, estoque, coleta, parceiros e predicao.

- Regra principal:
  ProducaoModule deve importar OrdenhaModule, ProducaoDiariaModule, RetiradaModule, LactacaoModule, LaticiniosModule e PredicaoProducaoModule.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de injecao de dependencia se algum submodulo nao estiver registrado.

- Criterio de aceite:
  O modulo raiz declara os seis submodulos no array de imports.

- Rastreabilidade para codigo e testes:
  src/modules/producao/producao.module.ts

- Status:
  implementada

## PROD-ARCH-002 - Endpoints do dominio exigem autenticacao JWT

- Contexto de negocio:
  Dados de producao e contratos com laticinios nao devem ser expostos sem autenticacao.

- Regra principal:
  Controllers de ordenha, lactacao, producao diaria, retirada, laticinios e predicao devem usar SupabaseAuthGuard.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token ausente, invalido ou expirado.

- Criterio de aceite:
  Todos os controllers do modulo possuem @UseGuards(SupabaseAuthGuard).

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.controller.ts
  src/modules/producao/lactacao/lactacao.controller.ts
  src/modules/producao/producao-diaria/producao-diaria.controller.ts
  src/modules/producao/retirada/retirada.controller.ts
  src/modules/producao/laticinios/laticinios.controller.ts
  src/modules/producao/predicao-producao/predicao-producao.controller.ts
  src/modules/auth/guards/auth.guard.ts

- Status:
  implementada

## PROD-ARCH-003 - Dominio organiza fluxo fim-a-fim da producao leiteira

- Contexto de negocio:
  O processo operacional depende da sequencia ciclo de lactacao -> ordenha -> estoque -> retirada.

- Regra principal:
  O modulo deve manter responsabilidades separadas por subdominio, com contratos proprios para cada etapa.

- Excecoes:
  Predicao de producao e um fluxo analitico paralelo que nao altera estoque/coleta.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existem controllers/services/repositorios dedicados por subdominio, sem mistura de responsabilidades no mesmo endpoint.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/lactacao.controller.ts
  src/modules/producao/ordenha/ordenha.controller.ts
  src/modules/producao/producao-diaria/producao-diaria.controller.ts
  src/modules/producao/retirada/retirada.controller.ts
  src/modules/producao/laticinios/laticinios.controller.ts
  src/modules/producao/predicao-producao/predicao-producao.controller.ts

- Status:
  implementada

## PROD-ARCH-004 - Estrategia de soft delete e restauracao nao e homogenea

- Contexto de negocio:
  O dominio depende de restauracao para recuperacao de registros removidos por engano.

- Regra principal:
  Todas as entidades do modulo usam campo deletedAt para soft delete.

- Excecoes:
  O comportamento de restore varia entre subdominios (alguns restauram direto, outros tentam validar usando busca apenas de ativos).

- Erros esperados:
  Em alguns fluxos, o endpoint de restore pode retornar NotFound para registro realmente removido.

- Criterio de aceite:
  - Repositorios fazem update de deletedAt no soft delete.
  - Services expoem rotas de restore.
  - Existe divergencia de comportamento entre implementacoes.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/laticinios/laticinios.service.ts

- Status:
  parcial

## PROD-ARCH-005 - Validacao de ownership multi-tenant nao e uniforme

- Contexto de negocio:
  Em ambiente multi-tenant, operacoes por propriedade devem validar se o usuario autenticado tem vinculo com a propriedade alvo.

- Regra principal:
  A validacao de acesso por propriedade deveria ser aplicada de forma consistente nos endpoints do modulo.

- Excecoes:
  Ordenha aplica validacao de acesso explicitamente em consultas por bufala e por ciclo.

- Erros esperados:
  Listagens e cadastros de alguns subdominios aceitam id_propriedade sem validacao explicita de vinculo na camada de negocio.

- Criterio de aceite:
  - OrdenhaService usa AuthHelperService.validatePropriedadeAccess em fluxos especificos.
  - Outros services (lactacao, producao-diaria, retirada, laticinios) nao aplicam validacao equivalente em todas as operacoes.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/laticinios/laticinios.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## PROD-ARCH-006 - Nao ha cobertura automatizada dedicada para o modulo

- Contexto de negocio:
  Regras de producao impactam indicadores operacionais e devem ter regressao automatizada.

- Regra principal:
  O modulo deveria possuir testes unitarios/e2e proprios para fluxos criticos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Maior risco de regressao funcional em alteracoes de regras de ciclo, ordenha, retirada e predicao.

- Criterio de aceite:
  Nao existem arquivos de teste especificos do modulo producao no estado atual.

- Rastreabilidade para codigo e testes:
  test/app.e2e-spec.ts
  test/rebanho.e2e-spec.ts
  src/modules/producao

- Status:
  parcial
