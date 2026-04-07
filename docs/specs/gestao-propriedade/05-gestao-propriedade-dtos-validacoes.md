# GESTAO-PROPRIEDADE - DTOs e Validacoes

## GPROP-DTO-001 - DTO de propriedade valida identidade minima e formato de CNPJ

- Contexto de negocio:
  Cadastro de propriedade exige identificacao fiscal e vinculo com endereco existente.

- Regra principal:
  CreatePropriedadeDto deve exigir nome, cnpj no formato 00.000.000/0000-00 e idEndereco UUID valido.

- Excecoes:
  p_abcb e tipoManejo sao opcionais.

- Erros esperados:
  400 para campos obrigatorios ausentes ou formato invalido.

- Criterio de aceite:
  DTO aplica class-validator para nome/cnpj/idEndereco e gera mensagem de validacao adequada.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/dto/create-propriedade.dto.ts

- Status:
  implementada

## GPROP-DTO-002 - Update de propriedade bloqueia cnpj e idEndereco

- Contexto de negocio:
  Alteracao de CNPJ e endereco estrutural deve seguir fluxo controlado, nao patch generico.

- Regra principal:
  UpdatePropriedadeDto deve omitir cnpj e idEndereco do contrato de atualizacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para payload fora do contrato esperado.

- Criterio de aceite:
  DTO usa PartialType(OmitType(CreatePropriedadeDto, ['cnpj', 'idEndereco'])).

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/dto/update-propriedade.dto.ts

- Status:
  implementada

## GPROP-DTO-003 - DTO de endereco valida estrutura textual e formato de CEP

- Contexto de negocio:
  Endereco precisa consistencia minima para vinculo com propriedade e georreferencia futura.

- Regra principal:
  CreateEnderecoDto deve exigir pais/estado/cidade e validar CEP no formato 00000-000 quando informado.

- Excecoes:
  bairro, rua, numero e ponto_referencia sao opcionais.

- Erros esperados:
  400 para campos obrigatorios ausentes e CEP invalido.

- Criterio de aceite:
  DTO aplica validacoes com class-validator e regex de CEP.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/endereco/dto/create-endereco.dto.ts

- Status:
  implementada

## GPROP-DTO-004 - DTO de lote valida IDs e limites numericos basicos

- Contexto de negocio:
  Registro de lote deve manter integridade de vinculos e valores operacionais.

- Regra principal:
  CreateLoteDto deve exigir idPropriedade UUID, aceitar idGrupo opcional UUID, validar qtd_max como inteiro positivo e area_m2 como positivo.

- Excecoes:
  Campos descritivos e geo_mapa sao opcionais.

- Erros esperados:
  400 para UUID invalido ou limites numericos invalidos.

- Criterio de aceite:
  DTO usa validadores de UUID/integer/positive e transforma idGrupo vazio em undefined.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/lote/dto/create-lote.dto.ts

- Status:
  implementada

## GPROP-DTO-005 - Validacoes de negocio adicionais ficam no service, nao no validator custom do Core

- Contexto de negocio:
  Regras como ownership, compatibilidade grupo-propriedade e acesso por escopo nao cabem apenas em validacao estrutural de DTO.

- Regra principal:
  Modulo executa validacao de negocio no service layer e nao reutiliza validators customizados do Core.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException/BadRequestException para violacoes de negocio apos validacao de DTO.

- Criterio de aceite:
  Nao ha uso de core/validators no modulo; regras de negocio sao aplicadas em PropriedadeService, EnderecoService e LoteService.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/core/validators/date.validators.ts

- Status:
  parcial
