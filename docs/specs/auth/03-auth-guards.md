# AUTH - Guards e Strategy

## AUTH-GUARD-001 - SupabaseAuthGuard delega validacao JWT ao passport

- Contexto de negocio:
  Endpoints protegidos precisam validacao padrao de token bearer.

- Regra principal:
  SupabaseAuthGuard deve usar strategy jwt para autenticar requests.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 quando token estiver ausente/invalido/expirado.

- Criterio de aceite:
  Endpoints com @UseGuards(SupabaseAuthGuard) exigem bearer token valido.

- Rastreabilidade para codigo e testes:
  src/modules/auth/guards/auth.guard.ts
  src/modules/auth/supabase.strategy.ts

- Status:
  implementada

## AUTH-GUARD-002 - RolesGuard aplica controle por metadata

- Contexto de negocio:
  Nem todo usuario autenticado pode executar a mesma acao.

- Regra principal:
  RolesGuard deve ler metadata ROLES_KEY e bloquear acesso quando cargo do usuario nao estiver na lista requerida.

- Excecoes:
  Se rota nao definir roles, guard deve permitir passagem.

- Erros esperados:
  ForbiddenException para usuario sem cargo ou sem permissao.

- Criterio de aceite:
  Rotas com @Roles so aceitam cargos declarados.

- Rastreabilidade para codigo e testes:
  src/modules/auth/guards/roles.guard.ts
  src/modules/auth/decorators/roles.decorator.ts

- Status:
  implementada

## AUTH-GUARD-003 - OnboardingGuard restringe proprietario sem propriedade

- Contexto de negocio:
  Proprietario sem endereco/propriedade concluida nao deve acessar fluxos de operacao.

- Regra principal:
  OnboardingGuard deve validar onboarding apenas para cargo PROPRIETARIO e exigir ao menos uma propriedade vinculada.

- Excecoes:
  Cargos GERENTE, FUNCIONARIO e VETERINARIO nao passam por essa validacao.

- Erros esperados:
  ForbiddenException para perfil incompleto ou sem propriedades.

- Criterio de aceite:
  Proprietario sem propriedade recebe bloqueio com mensagem de onboarding incompleto.

- Rastreabilidade para codigo e testes:
  src/modules/auth/guards/onboarding.guard.ts

- Status:
  implementada

## AUTH-GUARD-004 - EmailVerifiedGuard valida confirmacao no Supabase

- Contexto de negocio:
  Operacoes sensiveis podem exigir email confirmado.

- Regra principal:
  Guard deve consultar usuario no Supabase Auth e bloquear acesso quando email_confirmed_at estiver vazio.

- Excecoes:
  Se request nao tiver usuario autenticado, guard nao bloqueia e delega ao AuthGuard.

- Erros esperados:
  ForbiddenException quando nao for possivel verificar email ou quando email nao estiver confirmado.

- Criterio de aceite:
  Usuario sem confirmacao de email recebe 403 em rotas protegidas por EmailVerifiedGuard.

- Rastreabilidade para codigo e testes:
  src/modules/auth/guards/email-verified.guard.ts

- Status:
  implementada

## AUTH-STRATEGY-001 - Token valido mesmo sem perfil local (modo onboarding)

- Contexto de negocio:
  Usuario autenticado pode existir no Supabase e ainda nao ter perfil local completo.

- Regra principal:
  Strategy deve retornar user com cargo/id_usuario nulos quando perfil local nao for encontrado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  UnauthorizedException se payload nao tiver sub ou se ocorrer erro critico na validacao.

- Criterio de aceite:
  Fluxos de onboarding conseguem autenticar usuario mesmo antes da criacao de perfil local completo.

- Rastreabilidade para codigo e testes:
  src/modules/auth/supabase.strategy.ts

- Status:
  implementada
