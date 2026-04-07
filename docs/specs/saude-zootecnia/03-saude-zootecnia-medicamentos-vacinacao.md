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
  CreateMedicacaoDto deve exigir idPropriedade UUID e repository deve persistir esse vinculo.

- Excecoes:
  Descricao e opcional.

- Erros esperados:
  400 para idPropriedade invalido ou campos obrigatorios ausentes.

- Criterio de aceite:
  DTO exige idPropriedade e repository usa idPropriedade no insert.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/medicamentos/dto/create-medicacao.dto.ts
  src/modules/saude-zootecnia/medicamentos/repositories/medicamentos.repository.drizzle.ts

- Status:
  implementada

## SZO-MED-003 - Restore de medicacao usa busca que ignora removidos

- Contexto de negocio:
  Restaurar item removido exige leitura que inclua registros com deletedAt preenchido.

- Regra principal:
  Fluxo de restore deveria buscar com escopo incluindo removidos antes de validar deletedAt.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, restore pode falhar por usar findById que filtra deletedAt nulo.

- Criterio de aceite:
  Service.restore chama repository.findById, e findById usa isNull(deletedAt).

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/medicamentos/medicamentos.service.ts
  src/modules/saude-zootecnia/medicamentos/repositories/medicamentos.repository.drizzle.ts

- Status:
  parcial

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

## SZO-VAC-003 - Filtro de vacinas especificas depende de lista fixa de IDs

- Contexto de negocio:
  Endpoint de vacinas especificas precisa separar aplicacoes que sao realmente vacinas no catalogo de medicacoes.

- Regra principal:
  No estado atual, filtro usa VACCINE_IDS fixo no repository para incluir apenas certos IDs de medicacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Possivel divergencia de comportamento quando IDs de medicacao mudarem ou nao coincidirem com a lista fixa.

- Criterio de aceite:
  VacinacaoRepository.findVacinasByBufalo filtra por array VACCINE_IDS hardcoded.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/vacinacao/repositories/vacinacao.repository.drizzle.ts

- Status:
  parcial

## SZO-VAC-004 - Restore de vacinacao herda limitacao de busca apenas ativa

- Contexto de negocio:
  Restauracao de registro removido requer busca incluindo removidos.

- Regra principal:
  Restore deveria localizar registro mesmo quando deletedAt estiver preenchido.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, restore chama findById via dados sanitarios, que filtra registros removidos.

- Criterio de aceite:
  Service.restore usa repository.findById e esse fluxo delega para findById de dados sanitarios (com isNull deletedAt).

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.ts
  src/modules/saude-zootecnia/vacinacao/repositories/vacinacao.repository.drizzle.ts
  src/modules/saude-zootecnia/dados-sanitarios/repositories/dados-sanitarios.repository.drizzle.ts

- Status:
  parcial
