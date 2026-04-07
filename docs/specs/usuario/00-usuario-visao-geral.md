# USUARIO - Visao Geral

## USR-ARCH-001 - Modulo usuario centraliza servicos e repositorios de identidade de dominio

- Contexto de negocio:
  O dominio precisa separar autenticacao (Auth) de perfil de negocio (Usuario) e vinculos com propriedades.

- Regra principal:
  UsuarioModule deve registrar UsuarioService, FuncionarioService e repositorios de usuario/usuario-propriedade/propriedade helper.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando providers nao sao importados/exportados corretamente.

- Criterio de aceite:
  UsuarioModule importa CoreModule/AuthModule e exporta os providers para consumo de outros modulos.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/usuario.module.ts

- Status:
  implementada

## USR-ARCH-002 - Endpoints de usuario exigem autenticacao JWT

- Contexto de negocio:
  Operacoes de usuario e funcionario lidam com dados sensiveis e nao podem ser anonimas.

- Regra principal:
  UsuarioController deve aplicar SupabaseAuthGuard em nivel de classe.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token ausente ou invalido.

- Criterio de aceite:
  Controller esta anotado com @UseGuards(SupabaseAuthGuard).

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/auth/supabase.strategy.ts

- Status:
  implementada

## USR-ARCH-003 - Cadastro de proprietario e funcionario e orquestrado no modulo auth

- Contexto de negocio:
  Fluxos de criacao exigem operacao atomica entre Supabase Auth e banco local.

- Regra principal:
  Cadastro deve ocorrer via endpoints /auth/signup-proprietario e /auth/signup-funcionario, usando AuthFacadeService para rollback compensatorio em falha.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400/409/500 conforme etapa de validacao, duplicidade ou falha de persistencia.

- Criterio de aceite:
  UsuarioController nao expoe POST para cadastro e AuthController concentra os endpoints de signup.

- Rastreabilidade para codigo e testes:
  src/modules/auth/auth.controller.ts
  src/modules/auth/auth-facade.service.ts
  src/modules/usuario/controller/usuario.controller.ts

- Status:
  implementada

## USR-ARCH-004 - Isolamento multi-tenant por propriedade deve ser uniforme no modulo

- Contexto de negocio:
  Em ambiente com multiplas propriedades, operacoes administrativas precisam restringir escopo por vinculo do solicitante.

- Regra principal:
  Listagem/consulta/edicao de usuarios e mudanca de cargo deveriam aplicar ownership por propriedade (ou regra equivalente de tenancy).

- Excecoes:
  Sem excecoes de negocio previstas para acesso global.

- Erros esperados:
  403/404 quando usuario tentar operar registros fora de seu escopo.

- Criterio de aceite:
  No estado atual, metodos findAll/findOne/update/updateCargo nao validam ownership por propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/controller/usuario.controller.ts
  src/modules/usuario/services/usuario.service.ts

- Status:
  parcial

## USR-TEST-001 - Cobertura de testes automatizados do modulo usuario

- Contexto de negocio:
  Regras de permissao, vinculo e cadastro possuem risco alto de regressao.

- Regra principal:
  Modulo deveria possuir testes unitarios/e2e dedicados para CRUD de usuario, update de cargo e vinculos de funcionario.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual nao foram encontrados testes especificos do modulo usuario em test/.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/
  test/

- Status:
  parcial
