# AUTH - DTOs e Decorators

## AUTH-DTO-001 - Contrato minimo para signin

- Contexto de negocio:
  Login deve ter payload enxuto e validado.

- Regra principal:
  SignInDto deve exigir email valido e senha como string.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para payload invalido.

- Criterio de aceite:
  Requisicao sem email valido e rejeitada na validacao.

- Rastreabilidade para codigo e testes:
  src/modules/auth/dto/sign-in.dto.ts

- Status:
  implementada

## AUTH-DTO-002 - Cadastro de proprietario com validacoes de formato

- Contexto de negocio:
  Dados de contato e identificacao precisam consistencia minima no cadastro.

- Regra principal:
  SignUpProprietarioDto deve validar email, senha minima de 6, nome maximo de 100, telefone em 10/11 digitos e UUID de endereco quando informado.

- Excecoes:
  idEndereco e opcional.

- Erros esperados:
  400 para campos obrigatorios ausentes ou formato invalido.

- Criterio de aceite:
  DTO rejeita telefone fora de padrao e idEndereco nao UUID.

- Rastreabilidade para codigo e testes:
  src/modules/auth/dto/signup-proprietario.dto.ts

- Status:
  implementada

## AUTH-DTO-003 - Cadastro de funcionario restringe cargos permitidos

- Contexto de negocio:
  Funcionario nao pode ser criado com cargo arbitrario fora da politica de negocio.

- Regra principal:
  SignUpFuncionarioDto deve aceitar apenas GERENTE, FUNCIONARIO ou VETERINARIO.

- Excecoes:
  idEndereco e idPropriedade sao opcionais.

- Erros esperados:
  400 para cargo fora da lista permitida.

- Criterio de aceite:
  DTO valida enum de cargo e rejeita valor fora do conjunto permitido.

- Rastreabilidade para codigo e testes:
  src/modules/auth/dto/signup-funcionario.dto.ts

- Status:
  implementada

## AUTH-DTO-004 - Refresh exige token nao vazio

- Contexto de negocio:
  Renovacao de sessao depende de refresh token valido.

- Regra principal:
  RefreshDto deve exigir refresh_token string nao vazio.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para campo ausente/vazio.

- Criterio de aceite:
  Endpoint /auth/refresh recusa payload sem refresh_token.

- Rastreabilidade para codigo e testes:
  src/modules/auth/dto/refresh.dto.ts

- Status:
  implementada

## AUTH-DEC-001 - Decorator Roles define metadata de autorizacao

- Contexto de negocio:
  Rotas precisam declarar permissoes de forma declarativa.

- Regra principal:
  Roles decorator deve gravar metadata ROLES_KEY para consumo pelo RolesGuard.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Rotas anotadas com @Roles recebem filtro de cargo no guard.

- Rastreabilidade para codigo e testes:
  src/modules/auth/decorators/roles.decorator.ts
  src/modules/auth/guards/roles.guard.ts

- Status:
  implementada

## AUTH-DEC-002 - Decorator User extrai claims do request.user

- Contexto de negocio:
  Controllers precisam acessar claims do usuario autenticado sem boilerplate repetido.

- Regra principal:
  User decorator deve retornar request.user inteiro ou campo especifico quando parametro for informado.

- Excecoes:
  Campo inexistente retorna undefined.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Endpoint consegue obter @User('sub') e @User('id_usuario') conforme necessidade.

- Rastreabilidade para codigo e testes:
  src/modules/auth/decorators/user.decorator.ts
  src/modules/auth/auth.controller.ts
  src/modules/alimentacao/registros/registros.controller.ts

- Status:
  implementada
