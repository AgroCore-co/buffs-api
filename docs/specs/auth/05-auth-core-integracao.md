# AUTH - Integracao com Core

## AUTH-CORE-001 - AuthModule depende de modulos compartilhados do Core

- Contexto de negocio:
  O modulo de autenticacao precisa providers transversais de infraestrutura e observabilidade.

- Regra principal:
  AuthModule deve importar CoreModule e LoggerModule para resolver SupabaseService e LoggerService usados no modulo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando providers compartilhados nao estiverem registrados.

- Criterio de aceite:
  AuthModule importa CoreModule e LoggerModule.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.module.ts

- Status:
  implementada

## AUTH-CORE-002 - SupabaseService e LoggerService do Core sao usados nos fluxos de sessao e validacao

- Contexto de negocio:
  Login, refresh, logout e validacao de token/email exigem integracao com Supabase e trilha de erro estruturada.

- Regra principal:
  AuthService, AuthFacadeService, SupabaseStrategy e EmailVerifiedGuard devem consumir SupabaseService e/ou LoggerService do Core.

- Excecoes:
  SupabaseAuthGuard e RolesGuard nao acessam Core diretamente por delegarem logica para strategy/metadata.

- Erros esperados:
  UnauthorizedException/ForbiddenException para token invalido, email nao verificado ou falha de validacao.

- Criterio de aceite:
  Integracoes com SupabaseService/LoggerService estao presentes nos componentes centrais de auth.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.service.ts
  src/modules/auth/auth-facade.service.ts
  src/modules/auth/supabase.strategy.ts
  src/modules/auth/guards/email-verified.guard.ts
  src/core/supabase/supabase.service.ts
  src/core/logger/logger.service.ts

- Status:
  implementada

## AUTH-CORE-003 - Utilitario de data do Core padroniza resposta de cadastro

- Contexto de negocio:
  Respostas de onboarding devem manter contrato consistente de datas para clientes.

- Regra principal:
  AuthFacadeService deve usar utilitarios de formatacao de data do Core ao retornar perfis criados.

- Excecoes:
  Endpoints de sessao (signin/refresh/signout) retornam payload de token do Supabase sem formatador adicional.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  registerProprietario e registerFuncionario usam formatDateFields para payload de usuario.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth-facade.service.ts
  src/core/utils/date-formatter.utils.ts

- Status:
  implementada

## AUTH-CORE-004 - Integracao com AuthHelperService para invalidacao de cache nao esta presente

- Contexto de negocio:
  Fluxos de cadastro/vinculo que alteram escopo de propriedades podem exigir invalidacao de cache de propriedades por usuario.

- Regra principal:
  Operacoes de registro de funcionario com vinculo de propriedades deveriam integrar com invalidacao de cache do helper central quando aplicavel.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, AuthFacadeService nao injeta AuthHelperService e nao chama invalidarCachePropriedades apos vinculo.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth-facade.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## AUTH-CORE-005 - Reuso de artefatos compartilhados de DTO/decorator/validator do Core e limitado

- Contexto de negocio:
  Artefatos compartilhados do Core podem reduzir divergencia de contratos entre modulos.

- Regra principal:
  Modulo auth usa DTOs e decorators proprios do dominio e nao reutiliza PaginationDto, decorator to-boolean e validators customizados de data do Core.

- Excecoes:
  Pode ser intencional pelo perfil de endpoints de autenticacao, que nao sao paginados.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao foram encontradas referencias a core/dto/pagination.dto.ts, core/decorators/to-boolean.decorator.ts ou core/validators/date.validators.ts no modulo auth.

- Rastreabilidade para codigo e testes:
  src/modules/auth/
  src/core/dto/pagination.dto.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts

- Status:
  parcial

## AUTH-TEST-001 - Cobertura de testes dedicada para fluxos de auth

- Contexto de negocio:
  Fluxos de autenticacao e cadastro possuem comportamento critico e exigem cobertura direta para evitar regressao.

- Regra principal:
  Modulo auth deveria possuir testes dedicados para signup-funcionario, refresh e signout, alem do setup de autenticacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, endpoints auth aparecem no helper de setup (signup-proprietario/signin), mas nao ha suite dedicada cobrindo todos os fluxos de auth.

- Rastreabilidade para codigo e testes:
  src/modules/auth/
  test/helpers/test-setup.ts
  test/rebanho.e2e-spec.ts

- Status:
  parcial