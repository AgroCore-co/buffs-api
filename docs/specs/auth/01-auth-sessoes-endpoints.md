# AUTH - Sessoes e Endpoints

## AUTH-SESSION-001 - Login retorna contrato de sessao completo

- Contexto de negocio:
  Clientes precisam de access token, refresh token e dados minimos do usuario para iniciar sessao.

- Regra principal:
  POST /auth/signin deve autenticar via Supabase e retornar access_token, refresh_token, expires_at e payload de usuario.

- Excecoes:
  Sem excecoes funcionais.

- Erros esperados:
  UnauthorizedException com mensagem de credenciais invalidas.

- Criterio de aceite:
  Credencial valida retorna objeto de sessao; credencial invalida retorna 401.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts
  src/modules/auth/auth.service.ts
  test/helpers/test-setup.ts

- Status:
  implementada

## AUTH-SESSION-002 - Refresh de token com validacao obrigatoria

- Contexto de negocio:
  Sessao precisa ser renovada sem exigir novo login quando access token expira.

- Regra principal:
  POST /auth/refresh deve exigir refresh_token e retornar novo pacote de sessao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  UnauthorizedException para refresh token invalido/expirado.

- Criterio de aceite:
  Refresh valido retorna novo access_token e refresh_token.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts
  src/modules/auth/auth.service.ts
  src/modules/auth/dto/refresh.dto.ts

- Status:
  implementada

## AUTH-SESSION-003 - Logout exige bearer token explicito

- Contexto de negocio:
  Logout deve invalidar sessao atual com token valido para reduzir risco de uso indevido.

- Regra principal:
  POST /auth/signout deve exigir header Authorization Bearer e usar admin signOut do Supabase.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  UnauthorizedException quando token nao for informado; BadRequestException quando provider rejeitar logout.

- Criterio de aceite:
  Chamada sem bearer token retorna erro, chamada valida retorna mensagem de logout.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts
  src/modules/auth/auth.service.ts

- Status:
  implementada

## AUTH-ENDPOINT-001 - Rate limit dedicado para signup

- Contexto de negocio:
  Endpoints de cadastro exigem protecao reforcada contra abuso e enumeracao.

- Regra principal:
  signup-proprietario deve limitar 3 req/min e signup-funcionario deve limitar 5 req/min.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  HTTP 429 quando limite for excedido.

- Criterio de aceite:
  Decorators de throttle aplicados nos dois endpoints de cadastro.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts

- Status:
  implementada
