# USUARIO - Integracao com Core

## USR-CORE-001 - Modulo usuario depende do CoreModule para providers compartilhados

- Contexto de negocio:
  Fluxos de usuario e funcionario dependem de servicos transversais (auth helper, logger, supabase e banco).

- Regra principal:
  UsuarioModule deve importar CoreModule para resolver dependencias do Core usadas em services e repositories.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando CoreModule/provedores nao estiverem disponiveis.

- Criterio de aceite:
  UsuarioModule importa forwardRef(() => CoreModule).

- Rastreabilidade para codigo e testes:
  src/modules/usuario/usuario.module.ts

- Status:
  implementada

## USR-CORE-002 - AuthHelperService do Core e usado para resolver propriedades do solicitante

- Contexto de negocio:
  Regras de vinculo de funcionario precisam recuperar propriedades do solicitante sem duplicar logica de autorizacao.

- Regra principal:
  Services do modulo devem usar AuthHelperService para recuperar propriedades do usuario quando necessario.

- Excecoes:
  Algumas operacoes administrativas continuam sem validacao de ownership por propriedade para usuario alvo.

- Erros esperados:
  NotFoundException quando solicitante nao possuir propriedades associadas.

- Criterio de aceite:
  UsuarioService e FuncionarioService usam getUserPropriedades via AuthHelperService.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/services/funcionario.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## USR-CORE-003 - LoggerService e utilitarios de data do Core sao usados no service layer

- Contexto de negocio:
  Fluxos de usuario precisam log estruturado e payload de resposta com datas padronizadas.

- Regra principal:
  Services do modulo devem usar LoggerService e formatadores de data do Core.

- Excecoes:
  Repositories do modulo usam DatabaseService diretamente e nao aplicam LoggerService de forma uniforme.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  UsuarioService e FuncionarioService usam LoggerService e formatDateFields/formatDateFieldsArray.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/services/funcionario.service.ts
  src/core/logger/logger.service.ts
  src/core/utils/date-formatter.utils.ts

- Status:
  implementada

## USR-CORE-004 - Integracao de cache no controller esta inconsistente

- Contexto de negocio:
  Modulo importa componentes de cache, mas endpoints de usuario nao aplicam TTL/interceptor de fato.

- Regra principal:
  Se o modulo declarar uso de cache, deve aplicar decorator e estrategia de invalidacao coerente.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, UsuarioController importa CacheInterceptor/CacheTTL, mas nao utiliza nos endpoints.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts

- Status:
  parcial

## USR-CORE-005 - Invalidação de cache de propriedades do Core nao e chamada apos vinculo/desvinculo

- Contexto de negocio:
  AuthHelperService cacheia propriedades do usuario; mudancas de vinculo devem refletir imediatamente.

- Regra principal:
  Fluxos de vincular/desvincular funcionario deveriam chamar invalidarCachePropriedades para evitar autorizacao stale.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual nao ha chamada a invalidarCachePropriedades em UsuarioService/FuncionarioService/AuthFacade para esses fluxos.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/services/funcionario.service.ts
  src/modules/auth/auth-facade.service.ts

- Status:
  parcial

## USR-CORE-006 - Reuso de DTO/decorator/validator compartilhado do Core e limitado

- Contexto de negocio:
  Core possui artefatos compartilhados que poderiam reduzir divergencia de contratos entre modulos.

- Regra principal:
  Modulo usuario atualmente usa DTOs proprios e class-validator padrao, sem reuso de PaginationDto, decorator to-boolean ou validators customizados de data.

- Excecoes:
  Pode ser intencional quando o dominio nao exige esses contratos compartilhados.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao foram encontradas referencias a core/dto/pagination.dto.ts, core/decorators/to-boolean.decorator.ts ou core/validators/date.validators.ts no modulo usuario.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/
  src/core/dto/pagination.dto.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts

- Status:
  parcial
