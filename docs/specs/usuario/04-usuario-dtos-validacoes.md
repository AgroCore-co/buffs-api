# USUARIO - DTOs e Validacoes

## USR-DTO-001 - Campos base de usuario possuem validacoes minimas de contrato

- Contexto de negocio:
  Nome, telefone e endereco precisam de formato consistente para persistencia e integracao.

- Regra principal:
  BaseUsuarioDto deve validar nome obrigatorio, telefone numerico de 10-11 digitos e idEndereco UUID valido quando informado.

- Excecoes:
  telefone e idEndereco sao opcionais.

- Erros esperados:
  400 para nome vazio, telefone fora do padrao ou UUID invalido.

- Criterio de aceite:
  DTO aplica class-validator + transform para tratar string vazia em idEndereco.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/dto/base-usuario.dto.ts

- Status:
  implementada

## USR-DTO-002 - Cadastro de proprietario fixa cargo em PROPRIETARIO

- Contexto de negocio:
  Fluxo de cadastro inicial deve impedir manipulacao de cargo arbitrario.

- Regra principal:
  CreateUsuarioDto deve expor cargo readonly com valor padrao PROPRIETARIO.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para payload invalido no DTO.

- Criterio de aceite:
  DTO estende BaseUsuarioDto e define cargo readonly com enum Cargo.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/dto/create-usuario.dto.ts
  src/modules/usuario/enums/cargo.enum.ts

- Status:
  implementada

## USR-DTO-003 - Cadastro de funcionario restringe dominio de cargo e credenciais

- Contexto de negocio:
  Fluxo de funcionario exige credencial inicial e nao pode criar PROPRIETARIO.

- Regra principal:
  DTOs de funcionario devem exigir email valido, senha minima e cargo no dominio GERENTE/FUNCIONARIO/VETERINARIO.

- Excecoes:
  telefone, idEndereco e idPropriedade sao opcionais.

- Erros esperados:
  400 para email invalido, senha curta, cargo fora de dominio ou UUID invalido.

- Criterio de aceite:
  SignUpFuncionarioDto e CreateFuncionarioDto validam os campos e bloqueiam PROPRIETARIO no contrato.

- Rastreabilidade para codigo e testes:
  src/modules/auth/dto/signup-funcionario.dto.ts
  src/modules/usuario/dto/create-funcionario.dto.ts
  src/modules/usuario/enums/cargo.enum.ts

- Status:
  implementada

## USR-DTO-004 - Patch de usuario herda contrato de create e pode gerar ambiguidade de cargo

- Contexto de negocio:
  DTO de update deve representar apenas campos realmente editaveis.

- Regra principal:
  UpdateUsuarioDto deveria refletir explicitamente os campos permitidos para edicao administrativa.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, UpdateUsuarioDto usa PartialType(CreateUsuarioDto), herdando campo cargo no contrato mesmo sem uso no repositorio de update.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/dto/update-usuario.dto.ts
  src/modules/usuario/dto/create-usuario.dto.ts
  src/modules/usuario/repositories/usuario.repository.drizzle.ts

- Status:
  parcial

## USR-DTO-005 - Comentarios de endpoint nos DTOs de usuario estao defasados do roteamento atual

- Contexto de negocio:
  Documentacao interna precisa refletir endpoint real para evitar integracao incorreta.

- Regra principal:
  Comentarios de DTO devem apontar para rotas ativas de cadastro em /auth/signup-*.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, CreateUsuarioDto e CreateFuncionarioDto referenciam endpoints de cadastro fora do roteamento ativo do UsuarioController.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/dto/create-usuario.dto.ts
  src/modules/usuario/dto/create-funcionario.dto.ts
  src/modules/auth/auth.controller.ts
  src/modules/usuario/controller/usuario.controller.ts

- Status:
  parcial
