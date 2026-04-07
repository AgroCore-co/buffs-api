# REBANHO - Integracao com Core

## REB-CORE-001 - Submodulos rebanho importam infraestrutura compartilhada do Core

- Contexto de negocio:
  Rebanho depende de autenticacao, logging e acesso a banco em todos os subdominios.

- Regra principal:
  Bufalo/Grupo/Raca/MovLote devem importar modulos compartilhados (Auth, Logger, Database e, quando aplicavel, CoreModule/SupabaseModule).

- Excecoes:
  BufaloModule usa CoreModule diretamente para acessar helpers compartilhados.

- Erros esperados:
  Falha de DI sem providers compartilhados.

- Criterio de aceite:
  Modulos de rebanho possuem imports explicitos de infraestrutura Core.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.module.ts
  src/modules/rebanho/grupo/grupo.module.ts
  src/modules/rebanho/raca/raca.module.ts
  src/modules/rebanho/mov-lote/mov-lote.module.ts

- Status:
  implementada

## REB-CORE-002 - DatabaseService e LoggerService sao base do service/repository layer

- Contexto de negocio:
  Operacao do modulo exige observabilidade e acesso transacional padronizado.

- Regra principal:
  Repositories devem usar DatabaseService e services/controllers devem registrar logs com LoggerService.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException quando falhas de banco nao forem tratadas nos repositorios.

- Criterio de aceite:
  Repositories de bufalo/grupo/raca/mov-lote injetam DatabaseService e camadas de servico/controlador usam LoggerService.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/repositories/bufalo.repository.drizzle.ts
  src/modules/rebanho/grupo/repositories/grupo.repository.drizzle.ts
  src/modules/rebanho/raca/repositories/raca.repository.drizzle.ts
  src/modules/rebanho/mov-lote/repositories/mov-lote.repository.drizzle.ts
  src/core/database/database.service.ts
  src/core/logger/logger.service.ts

- Status:
  implementada

## REB-CORE-003 - AuthHelperService centraliza autorizacao por propriedade no subdominio de bufalo

- Contexto de negocio:
  Operacoes de animal precisam validar ownership por propriedade em ambiente multi-tenant.

- Regra principal:
  BufaloService deve delegar identificacao do usuario e validacao de acesso para AuthHelperService.

- Excecoes:
  Fluxos de grupo e mov-lote nao reutilizam esse helper no estado atual.

- Erros esperados:
  NotFoundException para recursos fora do escopo do usuario.

- Criterio de aceite:
  BufaloService chama getUserId/getUserPropriedades/validatePropriedadeAccess e expoe invalidarCachePropriedades.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## REB-CORE-004 - Ownership central nao esta uniforme em todo o modulo

- Contexto de negocio:
  Regras de seguranca por propriedade devem ser consistentes entre todos os subdominios do rebanho.

- Regra principal:
  Endpoints de grupo e mov-lote por propriedade deveriam validar escopo do usuario com helper central ou guard especializado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, fluxos podem aceitar id_propriedade valido sem validar vinculo do usuario em todas as operacoes.

- Criterio de aceite:
  GrupoService e MovLoteService nao utilizam AuthHelperService/PropertyExistsGuard para ownership.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/grupo/grupo.service.ts
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/core/services/auth-helper.service.ts
  src/core/guards/property-exists.guard.ts

- Status:
  parcial

## REB-CORE-005 - Reuso de artefatos compartilhados do Core e amplo, mas nao uniforme

- Contexto de negocio:
  Reuso de DTOs/decorators/validators/utilitarios reduz divergencia de contrato e comportamento.

- Regra principal:
  Modulo rebanho reutiliza PaginationDto, utilitarios de paginacao, formatadores de data, interface de soft delete, decorator ToBoolean e validators de data do Core.

- Excecoes:
  Alguns subdominios (ex.: mov-lote) usam apenas subconjunto desses artefatos.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Ha referencias diretas aos artefatos compartilhados em bufalo/grupo/mov-lote e DTOs de rebanho.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/grupo/grupo.service.ts
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/modules/rebanho/bufalo/dto/filtro-avancado-bufalo.dto.ts
  src/modules/rebanho/bufalo/dto/create-bufalo.dto.ts
  src/modules/rebanho/bufalo/dto/inativar-bufalo.dto.ts
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts
  src/core/utils/date-formatter.utils.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts
  src/core/interfaces/soft-delete.interface.ts

- Status:
  implementada

## REB-CORE-006 - Cache do Core e aplicado de forma heterogenea

- Contexto de negocio:
  Carga de leitura varia por subdominio e exige estrategia de cache coerente por endpoint.

- Regra principal:
  Controllers de bufalo/grupo/raca usam CacheInterceptor/CacheTTL em consultas selecionadas, enquanto mov-lote nao aplica cache.

- Excecoes:
  Parte dos endpoints de bufalo removeu cache por alta mutabilidade de dados.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Integracao de cache existe em bufalo/grupo/raca e nao ha invalidacao explicita para todos os cenarios de escrita.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.controller.ts
  src/modules/rebanho/grupo/grupo.controller.ts
  src/modules/rebanho/raca/raca.controller.ts
  src/modules/rebanho/mov-lote/mov-lote.controller.ts

- Status:
  parcial

## REB-CORE-007 - CacheService do Core nao aparece em runtime do modulo

- Contexto de negocio:
  Padrao de cache central poderia ser usado no service layer para invalidacao controlada.

- Regra principal:
  No estado atual, CacheService nao e injetado nos services de runtime do modulo rebanho, aparecendo apenas em testes de bufalo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao ha uso runtime de CacheService em src/modules/rebanho; referencia existente esta em bufalo.service.spec.ts.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/
  src/modules/rebanho/bufalo/bufalo.service.spec.ts
  src/core/cache/cache.service.ts

- Status:
  parcial

## REB-TEST-001 - Integracao com Core possui cobertura forte em bufalo e lacuna nos demais subdominios

- Contexto de negocio:
  Regras de autorizacao, maturidade e filtragem em bufalo possuem alta criticidade e precisam ser validadas continuamente.

- Regra principal:
  Cobertura atual valida principalmente bufalo (unit + scheduler + e2e), com ausencia de suites equivalentes para grupo/raca/mov-lote.

- Excecoes:
  Alguns cenarios de e2e estao marcados como skip por restricoes do ambiente de execucao.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existem testes dedicados para bufalo e nao foram encontrados .spec.ts dedicados para grupo/raca/mov-lote.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.spec.ts
  src/modules/rebanho/bufalo/bufalo.scheduler.spec.ts
  src/modules/rebanho/bufalo/services/bufalo-maturidade.service.spec.ts
  test/rebanho.e2e-spec.ts
  src/modules/rebanho/**/*.spec.ts

- Status:
  parcial