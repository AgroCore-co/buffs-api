# USUARIO - Funcionarios e Vinculos

## USR-FUNC-001 - Cadastro de funcionario em operacao atomica

- Contexto de negocio:
  Criacao de funcionario envolve conta de autenticacao, perfil local e vinculo com propriedade.

- Regra principal:
  POST /auth/signup-funcionario deve criar auth + perfil + vinculos e executar rollback da conta auth se perfil/vinculo falhar.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException, ConflictException e InternalServerErrorException conforme etapa que falhar.

- Criterio de aceite:
  AuthFacadeService cria conta, cria perfil, vincula propriedades e tenta deleteUser em caso de rollback.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts
  src/modules/auth/auth-facade.service.ts
  src/modules/usuario/repositories/usuario.repository.drizzle.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  implementada

## USR-FUNC-002 - Propriedade informada no cadastro deve pertencer ao solicitante

- Contexto de negocio:
  Cadastro de funcionario em propriedade de terceiros viola isolamento por tenant.

- Regra principal:
  Se idPropriedade for informado, o fluxo deve validar que pertence ao dono solicitante antes do vinculo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException quando propriedade nao pertence ao solicitante.

- Criterio de aceite:
  registerFuncionario valida idPropriedade contra listarPorDono do proprietario.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth-facade.service.ts
  src/modules/usuario/repositories/helper/propriedade.repository.helper.ts

- Status:
  implementada

## USR-FUNC-003 - Sem idPropriedade explicito, funcionario herda todas as propriedades do dono

- Contexto de negocio:
  Onboarding rapido de funcionario pode exigir vinculo em todas as fazendas do dono.

- Regra principal:
  Quando idPropriedade nao for enviado, o sistema deve vincular funcionario a todas as propriedades retornadas para o dono.

- Excecoes:
  Se dono nao tiver propriedades, fluxo deve falhar.

- Erros esperados:
  BadRequestException para dono sem propriedades.

- Criterio de aceite:
  registerFuncionario monta propriedadesVinculadas com toda a lista de listarPorDono quando campo nao e informado.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth-facade.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  implementada

## USR-FUNC-004 - Listagem de funcionarios por propriedade exige ownership

- Contexto de negocio:
  Visualizacao por propriedade deve ser permitida apenas ao dono daquela propriedade.

- Regra principal:
  GET /usuarios/funcionarios/propriedade/:idPropriedade deve validar se propriedade pertence ao usuario autenticado antes de listar funcionarios.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ForbiddenException quando solicitante nao for dono da propriedade.

- Criterio de aceite:
  FuncionarioService verifica pertenceAoDono e so depois consulta listarUsuariosPorPropriedade.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/funcionario.service.ts
  src/modules/usuario/repositories/helper/propriedade.repository.helper.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  implementada

## USR-FUNC-005 - Listagem consolidada de funcionarios usa propriedades associadas ao solicitante

- Contexto de negocio:
  Painel operacional precisa listar funcionarios de todas as propriedades relacionadas ao usuario.

- Regra principal:
  GET /usuarios/funcionarios deve obter propriedades via AuthHelperService e listar usuarios vinculados a esse conjunto.

- Excecoes:
  Usuario sem propriedades associadas recebe erro de negocio.

- Erros esperados:
  NotFoundException quando solicitante nao estiver associado a nenhuma propriedade.

- Criterio de aceite:
  listarMeusFuncionarios chama getUserPropriedades e listarUsuariosPorPropriedades.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/funcionario.service.ts
  src/core/services/auth-helper.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  implementada

## USR-FUNC-006 - Desvinculo de funcionario exige ownership e vinculo existente

- Contexto de negocio:
  Remocao de acesso do funcionario deve ser auditavel e controlada por propriedade.

- Regra principal:
  DELETE /usuarios/funcionarios/:idUsuario/propriedade/:idPropriedade deve validar ownership da propriedade e existencia do vinculo antes de confirmar operacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ForbiddenException para propriedade sem ownership; NotFoundException para vinculo inexistente.

- Criterio de aceite:
  Service valida pertenceAoDono, depois executa desvincular e retorna mensagem de sucesso.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/funcionario.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  implementada

## USR-FUNC-007 - Permissao de GERENTE no signup-funcionario esta inconsistente com regra de ownership aplicada

- Contexto de negocio:
  Endpoint permite GERENTE, mas validacoes internas usam propriedades do dono para decisao de vinculo.

- Regra principal:
  Se GERENTE for permitido no endpoint, fluxo deve validar propriedades que o gerente realmente administra (ou restringir endpoint a PROPRIETARIO).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException para gerente sem propriedades como dono, mesmo tendo role permitida no endpoint.

- Criterio de aceite:
  No estado atual, endpoint aceita GERENTE via role, mas AuthFacade busca propriedades via listarPorDono do usuario autenticado.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts
  src/modules/auth/auth-facade.service.ts
  src/modules/usuario/repositories/helper/propriedade.repository.helper.ts

- Status:
  parcial

## USR-FUNC-008 - Vinculo/desvinculo deve invalidar cache de propriedades

- Contexto de negocio:
  Cache de propriedades impacta autorizacao em diversos modulos.

- Regra principal:
  Apos cadastro de funcionario, vinculacao ou desvinculo, cache de propriedades do usuario afetado deveria ser invalidado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, fluxos de vincular/desvincular nao chamam invalidarCachePropriedades.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/modules/usuario/services/funcionario.service.ts
  src/modules/auth/auth-facade.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  parcial
