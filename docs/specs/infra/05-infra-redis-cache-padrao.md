# INFRA - Redis como Cache Padrao

## INFRA-REDIS-001 - Redis deve ser o backend padrao de cache da API

- Contexto de negocio:
  O cache em memoria local nao escala bem entre multiplas instancias da API e nao garante compartilhamento de estado em ambiente distribuido.

- Regra principal:
  A API deve migrar do cache em memoria para Redis como backend padrao de cache em todos os ambientes.

- Excecoes:
  Ambiente local pode manter fallback em memoria somente para diagnostico pontual e explicitamente sinalizado.

- Erros esperados:
  Sem Redis configurado, recursos dependentes de cache (cache-aside, rate limit e CacheInterceptor) podem perder consistencia entre instancias.

- Criterio de aceite:
  CacheConfigModule passa a usar store Redis e a aplicacao usa a mesma origem de cache para leituras e escritas.

- Rastreabilidade para codigo e testes:
  src/core/cache/cache.module.ts
  src/core/cache/cache.service.ts
  src/core/core.module.ts
  infra/docker-compose.yml
  infra/docker-compose.prod.yml

- Status:
  pendente

## INFRA-REDIS-002 - Modulos impactados diretamente pela migracao

- Contexto de negocio:
  A mudanca de backend de cache afeta modulos que usam CacheService e modulos que usam CacheInterceptor/CacheTTL.

- Regra principal:
  A documentacao de migracao deve listar os modulos impactados para planejamento de rollout e testes regressivos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem mapeamento claro, o time pode migrar parcialmente e manter comportamento inconsistente de cache entre modulos.

- Criterio de aceite:
  Foram identificados os seguintes grupos de impacto:
  1. Core de cache e autorizacao:
     - src/core/cache/cache.module.ts
     - src/core/cache/cache.service.ts
     - src/core/cache/cache.constants.ts
     - src/core/services/auth-helper.service.ts
  2. Modulos com CacheService aplicado em regra de negocio:
     - src/modules/data-ingestion/validators/data-ingestion.validator.ts
     - src/modules/reproducao/cobertura/cobertura.service.ts
  3. Modulos com CacheInterceptor/CacheTTL em controllers:
     - src/modules/alerta/alerta.controller.ts
     - src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts
     - src/modules/dashboard/dashboard.controller.ts
     - src/modules/gestao-propriedade/endereco/endereco.controller.ts
     - src/modules/gestao-propriedade/propriedade/propriedade.controller.ts
     - src/modules/producao/lactacao/lactacao.controller.ts
     - src/modules/producao/predicao-producao/predicao-producao.controller.ts
     - src/modules/producao/retirada/retirada.controller.ts
     - src/modules/rebanho/bufalo/bufalo.controller.ts
     - src/modules/rebanho/grupo/grupo.controller.ts
     - src/modules/rebanho/raca/raca.controller.ts
     - src/modules/reproducao/genealogia/genealogia.controller.ts
  4. Modulos com registro local de CacheModule (revisao obrigatoria):
     - src/modules/reproducao/genealogia/genealogia.module.ts
     - src/modules/producao/predicao-producao/predicao-producao.module.ts

- Rastreabilidade para codigo e testes:
  src/core/cache/cache.module.ts
  src/modules/**/**/*.controller.ts
  src/modules/**/**/*.module.ts

- Status:
  implementada

## INFRA-REDIS-003 - Mudancas tecnicas necessarias na API

- Contexto de negocio:
  Para Redis ser padrao de verdade, o bootstrap de cache precisa sair do store em memoria e convergir configuracao em um unico modulo.

- Regra principal:
  A migracao deve executar as seguintes mudancas minimas:
  1. Configurar store Redis no CacheConfigModule com variaveis dedicadas (ex.: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD ou REDIS_URL).
  2. Remover registros locais de CacheModule.register() e padronizar uso do CacheConfigModule/global cache.
  3. Revisar semantica de TTL em CacheService/CacheTTL e decorators @CacheTTL para garantir unidade consistente apos migracao.
  4. Ajustar logging e fallback para falha de conexao com Redis (fail-soft controlado).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem revisao de TTL, valores podem ficar acima ou abaixo do esperado dependendo da unidade aplicada pelo store.

- Criterio de aceite:
  API inicia com Redis conectado, usa cache compartilhado entre instancias e mantem comportamento previsivel de expiracao.

- Rastreabilidade para codigo e testes:
  src/core/cache/cache.module.ts
  src/core/cache/cache.constants.ts
  src/modules/reproducao/genealogia/genealogia.module.ts
  src/modules/producao/predicao-producao/predicao-producao.module.ts

- Status:
  pendente

## INFRA-REDIS-004 - Mudancas necessarias nos manifests de infraestrutura

- Contexto de negocio:
  Redis padrao requer servico ativo e integrado nos manifests local/producao para evitar divergencia de ambiente.

- Regra principal:
  Os manifests devem ativar Redis e conectar a API via rede interna.

- Excecoes:
  Em ambiente local, Redis pode continuar opcional somente durante janela de transicao documentada.

- Erros esperados:
  Sem servico Redis ativo no compose, a API pode falhar no bootstrap ou cair em fallback nao desejado.

- Criterio de aceite:
  1. infra/docker-compose.yml com servico redis ativo por padrao.
  2. infra/docker-compose.prod.yml com servico redis e healthcheck.
  3. buffs-api com depends_on redis (condition service_healthy quando suportado).
  4. Variavel REDIS_URL (ou equivalente) definida para usar hostname interno de servico.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/docker-compose.prod.yml
  infra/README.md

- Status:
  pendente

## INFRA-REDIS-005 - Rollout deve incluir teste de regressao funcional nos modulos com cache

- Contexto de negocio:
  Migracao de backend de cache altera comportamento de expiracao, isolamento e hit ratio.

- Regra principal:
  O rollout deve validar os fluxos mais sensiveis com cache ativo em Redis antes de promover para producao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem regressao controlada, podem ocorrer erros de autorizacao por cache stale, rate limit inconsistente ou comportamento divergente de endpoints com CacheInterceptor.

- Criterio de aceite:
  Checklist minimo de validacao:
  1. auth-helper: cache de propriedades e invalidacao.
  2. data-ingestion: rate limit por propriedade.
  3. controllers com CacheInterceptor/CacheTTL em leitura.
  4. observacao de hit/miss e expiracao em Redis.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/modules/**/**/*.controller.ts

- Status:
  pendente
