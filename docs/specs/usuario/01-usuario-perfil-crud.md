# USUARIO - Perfil e CRUD

## USR-PERFIL-001 - Consulta do proprio perfil por token autenticado

- Contexto de negocio:
  Usuario logado precisa consultar seus dados de perfil sem informar ID manualmente.

- Regra principal:
  GET /usuarios/me deve buscar perfil a partir do email do token autenticado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException quando nao existir perfil local para o email autenticado.

- Criterio de aceite:
  Endpoint usa @User() e service consulta buscarPorEmail.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/repositories/usuario.repository.drizzle.ts

- Status:
  implementada

## USR-PERFIL-002 - Listagem administrativa de usuarios

- Contexto de negocio:
  Proprietario/gerente precisam visibilidade de usuarios para operacao administrativa.

- Regra principal:
  GET /usuarios deve ser protegido por RolesGuard para cargos PROPRIETARIO e GERENTE e retornar usuarios com endereco agregado quando existir.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ForbiddenException quando cargo nao autorizado.

- Criterio de aceite:
  Endpoint aplica @Roles(PROPRIETARIO, GERENTE) e service retorna payload normalizado com endereco opcional.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/repositories/usuario.repository.drizzle.ts

- Status:
  implementada

## USR-PERFIL-003 - Consulta e atualizacao por UUID com validacao de existencia

- Contexto de negocio:
  Operacoes de manutencao precisam retornar erro consistente para IDs inexistentes.

- Regra principal:
  GET /usuarios/:id e PATCH /usuarios/:id devem validar existencia do usuario alvo e retornar 404 quando nao encontrado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para usuario inexistente.

- Criterio de aceite:
  findOne/update consultam repositorio e levantam NotFoundException quando retorno for nulo.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/repositories/usuario.repository.drizzle.ts

- Status:
  implementada

## USR-PERFIL-004 - Exclusao administrativa de usuario local

- Contexto de negocio:
  Dono do sistema precisa remover perfis locais de usuario quando necessario.

- Regra principal:
  DELETE /usuarios/:id deve ser restrito a PROPRIETARIO e remover registro da tabela usuario.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException quando o id nao existir; erro de banco em caso de restricao referencial.

- Criterio de aceite:
  Endpoint exige @Roles(PROPRIETARIO) e service executa delete fisico no repositorio.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/repositories/usuario.repository.drizzle.ts
  src/database/schema.ts

- Status:
  implementada

## USR-PERFIL-005 - Exclusao deveria manter consistencia entre auth, vinculos e perfil local

- Contexto de negocio:
  Remover apenas o perfil local pode deixar conta ativa no auth provider e vinculos residuais.

- Regra principal:
  Fluxo de exclusao deveria tratar conta no Supabase Auth e desvinculos necessarios para evitar estado orfao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  409/500 em cenarios de FK ou inconsistencias de identidade.

- Criterio de aceite:
  No estado atual remove atua apenas na tabela usuario e nao executa cleanup explicito de auth/vinculos.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/services/usuario.service.ts
  src/modules/usuario/repositories/usuario.repository.drizzle.ts
  src/modules/auth/auth.service.ts
  src/database/schema.ts

- Status:
  parcial
