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

## REB-CORE-003 - AuthHelperService centraliza autorizacao por propriedade no modulo

- Contexto de negocio:
  Operacoes de animal precisam validar ownership por propriedade em ambiente multi-tenant.

- Regra principal:
  Services de rebanho com escopo de propriedade devem delegar identificacao do usuario e validacao de acesso para AuthHelperService.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para recursos fora do escopo do usuario.

- Criterio de aceite:
  BufaloService, GrupoService e MovLoteService usam getUserId/getUserPropriedades/validatePropriedadeAccess nos fluxos de ownership.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/grupo/grupo.service.ts
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## REB-CORE-004 - Ownership central esta uniforme em todo o modulo

- Contexto de negocio:
  Regras de seguranca por propriedade devem ser consistentes entre todos os subdominios do rebanho.

- Regra principal:
  Endpoints de grupo e mov-lote por propriedade devem validar escopo do usuario com helper central e guard especializado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para recursos fora do escopo do usuario.

- Criterio de aceite:
  GrupoService e MovLoteService utilizam AuthHelperService para ownership e rotas por propriedade aplicam PropertyExistsGuard.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/grupo/grupo.service.ts
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/core/services/auth-helper.service.ts
  src/core/guards/property-exists.guard.ts

- Status:
  implementada

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
  Integracao de cache existe em bufalo/grupo/raca, com invalidacao explicita no service layer apos operacoes de escrita nos tres subdominios.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.controller.ts
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/grupo/grupo.controller.ts
  src/modules/rebanho/grupo/grupo.service.ts
  src/modules/rebanho/raca/raca.controller.ts
  src/modules/rebanho/raca/raca.service.ts
  src/modules/rebanho/mov-lote/mov-lote.controller.ts

- Status:
  implementada

## REB-CORE-007 - CacheService do Core e usado em runtime para invalidacao

- Contexto de negocio:
  Padrao de cache central poderia ser usado no service layer para invalidacao controlada.

- Regra principal:
  CacheService deve ser injetado em services de runtime para invalidacao de cache apos escrita.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Ha uso runtime de CacheService em bufalo, grupo e raca para invalidacao de cache apos create/update/delete/restore.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/grupo/grupo.service.ts
  src/modules/rebanho/raca/raca.service.ts
  src/modules/rebanho/bufalo/bufalo.service.spec.ts
  src/core/cache/cache.service.ts

- Status:
  implementada

## REB-TEST-001 - Integracao com Core possui cobertura unit de service nos quatro subdominios

- Contexto de negocio:
  Regras de autorizacao, maturidade e filtragem em bufalo possuem alta criticidade e precisam ser validadas continuamente.

- Regra principal:
  Cobertura atual valida bufalo (unit + scheduler + e2e) e possui suites unitarias de service para grupo, raca e mov-lote.

- Excecoes:
  Alguns cenarios de e2e estao marcados como skip por restricoes do ambiente de execucao.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existem testes dedicados para bufalo, grupo, raca e mov-lote no modulo rebanho.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.spec.ts
  src/modules/rebanho/bufalo/bufalo.scheduler.spec.ts
  src/modules/rebanho/bufalo/services/bufalo-maturidade.service.spec.ts
  src/modules/rebanho/grupo/grupo.service.spec.ts
  src/modules/rebanho/raca/raca.service.spec.ts
  src/modules/rebanho/mov-lote/mov-lote.service.spec.ts
  test/rebanho.e2e-spec.ts
  src/modules/rebanho/**/*.spec.ts

- Status:
  implementada
