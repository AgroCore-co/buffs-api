# USUARIO - Cargos e Acesso

## USR-ACCESS-001 - Autorizacao por cargo via RolesGuard

- Contexto de negocio:
  Acoes administrativas de usuario devem respeitar hierarquia de cargos.

- Regra principal:
  Endpoints anotados com @Roles devem ser bloqueados quando request.user.cargo nao estiver na lista permitida.

- Excecoes:
  Endpoints sem @Roles nao passam por filtro de cargo no guard.

- Erros esperados:
  ForbiddenException para cargo ausente ou nao permitido.

- Criterio de aceite:
  RolesGuard usa ROLES_KEY e valida includes(requiredRoles, user.cargo).

- Rastreabilidade para codigo e testes:
  src/modules/auth/guards/roles.guard.ts
  src/modules/usuario/controller/usuario.controller.ts

- Status:
  implementada

## USR-ACCESS-002 - Atualizacao de cargo aceita apenas perfis administrativos como solicitante

- Contexto de negocio:
  Mudanca de cargo altera privilegios e precisa ser controlada.

- Regra principal:
  PATCH /usuarios/:id/cargo deve exigir solicitante com cargo PROPRIETARIO ou GERENTE.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ForbiddenException para solicitante invalido ou cargo nao permitido.

- Criterio de aceite:
  Controller aplica @Roles(PROPRIETARIO, GERENTE) e service revalida solicitante antes da alteracao.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/usuario.service.ts

- Status:
  implementada

## USR-ACCESS-003 - Dominio de cargos permitidos para update e restrito

- Contexto de negocio:
  Cargo PROPRIETARIO nao pode ser promovido/rebaixado por fluxo de funcionario.

- Regra principal:
  updateCargo deve aceitar somente GERENTE, FUNCIONARIO ou VETERINARIO, e deve impedir alteracao quando usuario alvo for PROPRIETARIO.

- Excecoes:
  Se usuario ja possuir o cargo solicitado, operacao retorna sem alteracao efetiva.

- Erros esperados:
  BadRequestException para cargo fora do dominio permitido; ForbiddenException para tentativa de alterar PROPRIETARIO; NotFoundException para usuario inexistente.

- Criterio de aceite:
  Service valida dominio de cargo, busca usuario alvo e aplica bloqueio explicito para PROPRIETARIO.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/dto/update-cargo.dto.ts

- Status:
  implementada

## USR-ACCESS-004 - Update de cargo deve validar escopo entre solicitante e usuario alvo

- Contexto de negocio:
  Em modelo multi-tenant, administrador de uma propriedade nao deveria alterar cargo de usuario fora de seu escopo.

- Regra principal:
  Fluxo deveria checar vinculo entre solicitante e usuario alvo (ownership/vinculo em propriedade) antes de permitir alteracao de cargo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ForbiddenException para tentativa cross-tenant.

- Criterio de aceite:
  No estado atual, updateCargo valida role e dominio de cargo, mas nao valida relacao por propriedade entre solicitante e usuario alvo.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## USR-ACCESS-005 - Padrao de identificador de usuario autenticado deve ser uniforme

- Contexto de negocio:
  Inconsistencia entre auth_id, id_usuario e campos do token aumenta risco de erro em regras de autorizacao.

- Regra principal:
  Endpoints e services deveriam padronizar qual identificador e usado em cada fluxo (auth_id para autenticacao, id_usuario para dominio).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual existem usos mistos de @User('sub'), @User() com user.id e @User('id_usuario') em diferentes controllers/servicos.

- Rastreabilidade para codigo e testes:
  src/modules/auth/supabase.strategy.ts
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/usuario.service.ts
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.controller.ts
  src/modules/producao/retirada/retirada.controller.ts

- Status:
  parcial
