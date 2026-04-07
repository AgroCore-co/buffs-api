# AUTH - Visao Geral

## AUTH-ARCH-001 - Modulo de autenticacao com providers centrais

- Contexto de negocio:
  O sistema precisa centralizar autenticacao, autorizacao por cargo e fluxo de cadastro.

- Regra principal:
  AuthModule deve registrar strategy JWT, AuthService e AuthFacadeService, exportando providers para outros modulos.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Falha de injecao de dependencia se provider nao estiver exportado/importado corretamente.

- Criterio de aceite:
  Modulos consumidores conseguem usar SupabaseStrategy, AuthService e AuthFacadeService.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.module.ts

- Status:
  implementada

## AUTH-ARCH-002 - Fail-fast para segredo JWT do Supabase

- Contexto de negocio:
  Validacao de token sem segredo configurado gera falsa sensacao de seguranca.

- Regra principal:
  SupabaseStrategy deve falhar no startup quando SUPABASE_JWT_SECRET estiver ausente.

- Excecoes:
  Sem excecoes no runtime principal da API.

- Erros esperados:
  Erro de inicializacao explicitando ausencia de SUPABASE_JWT_SECRET.

- Criterio de aceite:
  Aplicacao nao sobe sem variavel de segredo JWT.

- Rastreabilidade para codigo e testes:
  src/modules/auth/supabase.strategy.ts

- Status:
  implementada

## AUTH-ARCH-003 - Guard global de throttling no modulo auth

- Contexto de negocio:
  Endpoints de autenticacao sao alvo frequente de abuso por tentativa de credencial.

- Regra principal:
  Modulo auth deve registrar ThrottlerGuard via APP_GUARD para aplicar limitacao de taxa.

- Excecoes:
  Endpoints especificos podem aplicar limites proprios com decorators de throttle.

- Erros esperados:
  HTTP 429 em excesso de tentativas.

- Criterio de aceite:
  Guard de throttling fica ativo e endpoints de signup aplicam limites configurados.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.module.ts
  src/modules/auth/auth.controller.ts

- Status:
  implementada
