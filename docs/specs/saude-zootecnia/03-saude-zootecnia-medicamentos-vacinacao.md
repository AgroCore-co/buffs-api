# SAUDE-ZOOTECNIA - Medicamentos e Vacinacao

## SZO-MED-001 - Catalogo de medicacoes possui CRUD com soft delete

- Contexto de negocio:
  Catalogo de medicamentos precisa evoluir sem perder historico de registros antigos.

- Regra principal:
  Modulo de medicamentos deve suportar create, read, update e remocao logica, com endpoint de restore.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para medicacao inexistente; BadRequestException para restore invalido.

- Criterio de aceite:
  MedicamentosService implementa ISoftDelete e repository possui softDelete/restore/findAllWithDeleted.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/medicamentos/medicamentos.service.ts
  src/modules/saude-zootecnia/medicamentos/repositories/medicamentos.repository.drizzle.ts

- Status:
  implementada

## SZO-MED-002 - Medicao e escopada por propriedade no contrato

- Contexto de negocio:
  Tratamentos disponiveis podem variar por propriedade e exigem vinculo explicito no cadastro.

- Regra principal:
  CreateMedicacaoDto deve exigir idPropriedade UUID e tipoTratamento canônico (enum), com normalizacao de aliases para padrao interno.

- Excecoes:
  Descricao e opcional.

- Erros esperados:
  400 para idPropriedade invalido ou campos obrigatorios ausentes.

- Criterio de aceite:
  DTO exige idPropriedade, valida tipoTratamento por enum e repository persiste tipoTratamento normalizado.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/medicamentos/dto/create-medicacao.dto.ts
  src/modules/saude-zootecnia/medicamentos/enums/tipo-tratamento.enum.ts
  src/modules/saude-zootecnia/medicamentos/repositories/medicamentos.repository.drizzle.ts

- Status:
  implementada

## SZO-MED-003 - Restore de medicacao usa busca incluindo removidos

- Contexto de negocio:
  Restaurar item removido exige leitura que inclua registros com deletedAt preenchido.

- Regra principal:
  Fluxo de restore busca com escopo incluindo removidos antes de validar deletedAt.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para id inexistente e BadRequestException para restore de registro ativo.

- Criterio de aceite:
  Service.restore chama repository.findByIdIncludingDeleted e so restaura quando deletedAt estiver preenchido.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/medicamentos/medicamentos.service.ts
  src/modules/saude-zootecnia/medicamentos/repositories/medicamentos.repository.drizzle.ts
  src/modules/saude-zootecnia/medicamentos/medicamentos.service.spec.ts

- Status:
  implementada

## SZO-VAC-001 - Vacinacao reutiliza tabela de dados sanitarios via repository adaptador

- Contexto de negocio:
  Vacinacao e um tipo especifico de evento sanitario e compartilha estrutura de persistencia com outros registros clinicos.

- Regra principal:
  VacinacaoRepository deve encapsular DadosSanitariosRepository, convertendo DTO de vacinacao para formato sanitario padrao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erros de persistencia herdados da camada de dados sanitarios.

- Criterio de aceite:
  VacinacaoRepository.create monta payload sanitario e delega create para DadosSanitariosRepository.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/vacinacao/repositories/vacinacao.repository.drizzle.ts
  src/modules/saude-zootecnia/dados-sanitarios/repositories/dados-sanitarios.repository.drizzle.ts

- Status:
  implementada

## SZO-VAC-002 - Registro de vacinacao associa usuario autenticado ao evento

- Contexto de negocio:
  Aplicacao de vacina precisa rastreabilidade do usuario que registrou o procedimento.

- Regra principal:
  Create de vacinacao deve receber auth_uuid via token, resolver usuario interno e persistir idUsuario no registro.

- Excecoes:
  Campos de dosagem e retorno podem ser opcionais.

- Erros esperados:
  NotFoundException/erros internos quando houver falha de relacao com dados sanitarios/medicacao.

- Criterio de aceite:
  Controller usa @User('sub') e service usa UserHelper.getInternalUserId antes da persistencia.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/vacinacao/vacinacao.controller.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.ts
  src/core/utils/user.helper.ts

- Status:
  implementada

## SZO-VAC-003 - Filtro de vacinas especificas usa criterio semantico formal

- Contexto de negocio:
  Endpoint de vacinas especificas precisa separar aplicacoes que sao realmente vacinas no catalogo de medicacoes.

- Regra principal:
  Filtro de vacinas especificas usa criterio semantico baseado em tipoTratamento canônico e aliases oficiais de vacinacao, com fallback restrito para legado sem tipo informado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Reduzir falso positivo para termos contendo "vac" fora do contexto de vacinacao.

- Criterio de aceite:
  VacinacaoRepository.findVacinasByBufalo aplica predicado por tipoTratamento (enum/aliases) e nao depende de IDs hardcoded.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/vacinacao/repositories/vacinacao.repository.drizzle.ts
  src/modules/saude-zootecnia/medicamentos/enums/tipo-tratamento.enum.ts
  src/modules/saude-zootecnia/medicamentos/enums/tipo-tratamento.enum.spec.ts

- Status:
  implementada

## SZO-VAC-004 - Restore de vacinacao usa busca incluindo removidos

- Contexto de negocio:
  Restauracao de registro removido requer busca incluindo removidos.

- Regra principal:
  Restore localiza registro incluindo removidos antes de validar deletedAt.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para id inexistente e BadRequestException para restore de registro ativo.

- Criterio de aceite:
  Service.restore usa repository.findByIdIncludingDeleted e restaura apenas registros removidos.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.ts
  src/modules/saude-zootecnia/vacinacao/repositories/vacinacao.repository.drizzle.ts
  src/modules/saude-zootecnia/dados-sanitarios/repositories/dados-sanitarios.repository.drizzle.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.spec.ts

- Status:
  implementada
