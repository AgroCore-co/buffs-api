# AUTH - Cadastro

## AUTH-SIGNUP-001 - Cadastro de proprietario em fluxo atomico

- Contexto de negocio:
  Criacao parcial de usuario (auth sem perfil local) gera inconsistencias operacionais.

- Regra principal:
  registerProprietario deve executar: validacao de duplicidade local, signup no Supabase e criacao do perfil local com cargo PROPRIETARIO.

- Excecoes:
  Sem excecoes no fluxo principal.

- Erros esperados:
  ConflictException para email ja cadastrado localmente; BadRequestException para erro no signup externo; InternalServerErrorException para falha na criacao de perfil.

- Criterio de aceite:
  Operacao retorna usuario local + sessao quando todas as etapas concluem.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth-facade.service.ts
  src/modules/auth/auth.controller.ts

- Status:
  implementada

## AUTH-SIGNUP-002 - Rollback de conta auth em falha de perfil local

- Contexto de negocio:
  Em falha pos-signup, conta de autenticacao nao pode ficar orfa sem perfil de dominio.

- Regra principal:
  Se criacao do perfil local falhar, facade deve tentar remover usuario criado no Supabase (rollback compensatorio).

- Excecoes:
  Se rollback falhar, erro e logado, mas erro principal ainda deve ser retornado ao cliente.

- Erros esperados:
  InternalServerErrorException apos tentativa de rollback.

- Criterio de aceite:
  Fluxo registra tentativa de deleteUser no rollback tanto para proprietario quanto funcionario.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth-facade.service.ts

- Status:
  implementada

## AUTH-SIGNUP-003 - Cadastro de funcionario restrito por cargo

- Contexto de negocio:
  Criacao de funcionarios deve ser controlada por governanca da propriedade.

- Regra principal:
  Endpoint signup-funcionario so deve aceitar usuarios com cargo PROPRIETARIO ou GERENTE.

- Excecoes:
  Sem excecoes no endpoint.

- Erros esperados:
  ForbiddenException quando cargo nao estiver autorizado.

- Criterio de aceite:
  Endpoint usa SupabaseAuthGuard + RolesGuard + @Roles(PROPRIETARIO, GERENTE).

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts
  src/modules/auth/guards/roles.guard.ts

- Status:
  implementada

## AUTH-SIGNUP-004 - Funcionario deve vincular em propriedade do proprietario

- Contexto de negocio:
  Vinculo indevido de funcionario em propriedade de terceiros viola isolamento de tenancy.

- Regra principal:
  registerFuncionario deve validar propriedade informada contra lista de propriedades do proprietario autenticado.

- Excecoes:
  Se idPropriedade nao for informado, funcionario e vinculado a todas as propriedades do proprietario.

- Erros esperados:
  BadRequestException quando propriedade nao pertence ao proprietario ou quando proprietario nao tem propriedades cadastradas.

- Criterio de aceite:
  Vinculo final respeita subconjunto valido de propriedades do proprietario.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth-facade.service.ts
  src/modules/auth/dto/signup-funcionario.dto.ts

- Status:
  implementada
