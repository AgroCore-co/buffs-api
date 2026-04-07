# ALIMENTACAO - Integracao com Core

## ALIM-CORE-001 - Submodulos de alimentacao usam providers compartilhados de infraestrutura

- Contexto de negocio:
  Definicoes e registros dependem de acesso a banco, autenticacao e logging padronizado.

- Regra principal:
  AlimentacaoDefModule e RegistrosModule devem importar DatabaseModule, AuthModule e LoggerModule.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI em controllers/services/repositorios quando providers nao estiverem disponiveis.

- Criterio de aceite:
  Ambos os submodulos importam DatabaseModule, AuthModule e LoggerModule.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.module.ts
  src/modules/alimentacao/registros/registros.module.ts

- Status:
  implementada

## ALIM-CORE-002 - DatabaseService do Core e usado em repositorios e validacoes de consistencia

- Contexto de negocio:
  Persistencia e validacoes cruzadas por propriedade/grupo/definicao precisam fonte unica de acesso ao banco.

- Regra principal:
  Repositorios Drizzle devem usar DatabaseService, e o service de registros pode usar DatabaseService para validacoes adicionais de integridade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException/BadRequestException quando grupo ou definicao nao forem encontrados ou nao pertencerem a propriedade informada.

- Criterio de aceite:
  AlimentacaoDefRepositoryDrizzle e RegistrosRepositoryDrizzle injetam DatabaseService; RegistrosService tambem usa DatabaseService para validar consistencia antes de criar.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/repositories/alimentacao-def.repository.drizzle.ts
  src/modules/alimentacao/registros/repositories/registros.repository.drizzle.ts
  src/modules/alimentacao/registros/registros.service.ts
  src/core/database/database.service.ts

- Status:
  implementada

## ALIM-CORE-003 - LoggerService e utilitarios de paginacao/data do Core sao usados no service layer

- Contexto de negocio:
  Endpoints de leitura de alimentacao precisam paginacao consistente, datas padronizadas e trilha de erro.

- Regra principal:
  Services de alimentacao devem usar LoggerService, PaginationDto e utilitarios compartilhados de paginacao/formatacao de data do Core.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException para falhas de count/listagem/persistencia com log estruturado.

- Criterio de aceite:
  AlimentacaoDefService e RegistrosService usam LoggerService, PaginationDto, calculatePaginationParams, createPaginatedResponse, formatDateFields e formatDateFieldsArray.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.service.ts
  src/modules/alimentacao/registros/registros.service.ts
  src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts
  src/modules/alimentacao/registros/registros.controller.ts
  src/core/logger/logger.service.ts
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts
  src/core/utils/date-formatter.utils.ts

- Status:
  implementada

## ALIM-CORE-004 - Cache do Core esta aplicado apenas em leituras de definicoes e sem invalidacao explicita

- Contexto de negocio:
  Catalogo de alimentacao e lido com frequencia, mas alteracoes de definicao devem refletir rapidamente.

- Regra principal:
  CacheInterceptor/CacheTTL pode ser usado em GETs, mas operacoes de escrita devem considerar estrategia de invalidacao coerente.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  AlimentacaoDefController aplica cache em GET por propriedade e GET por id; no estado atual nao ha invalidacao explicita apos create/update/delete.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts
  src/modules/alimentacao/alimentacao-def/alimentacao-def.service.ts

- Status:
  parcial

## ALIM-CORE-005 - Validacao de ownership por propriedade nao reutiliza helper central do Core

- Contexto de negocio:
  Em ambiente multi-tenant, autenticacao isolada nao garante autorizacao por propriedade.

- Regra principal:
  Fluxos de alimentacao deveriam reutilizar helper/guard central de ownership (ex.: AuthHelperService ou regra equivalente) para garantir escopo do usuario.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  403/404 para acesso a propriedade fora do escopo do usuario.

- Criterio de aceite:
  No estado atual, modulo usa SupabaseAuthGuard e validacoes de consistencia entre ids, mas nao usa AuthHelperService ou PropertyExistsGuard para ownership do usuario.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts
  src/modules/alimentacao/registros/registros.controller.ts
  src/modules/alimentacao/registros/registros.service.ts
  src/core/services/auth-helper.service.ts
  src/core/guards/property-exists.guard.ts

- Status:
  parcial

## ALIM-CORE-006 - Reuso de decoradores e validators compartilhados do Core e parcial

- Contexto de negocio:
  Artefatos compartilhados de validacao/decoracao ajudam a reduzir divergencia de contratos entre modulos.

- Regra principal:
  Modulo alimentacao ja reutiliza PaginationDto, mas nao ha evidencias de uso do decorator to-boolean nem dos validators customizados de data do Core.

- Excecoes:
  Pode ser intencional se os contratos atuais nao exigirem esses artefatos.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Foram encontradas referencias a PaginationDto e nao foram encontradas referencias a core/decorators/to-boolean.decorator.ts e core/validators/date.validators.ts no modulo.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/
  src/core/dto/pagination.dto.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts

- Status:
  parcial
