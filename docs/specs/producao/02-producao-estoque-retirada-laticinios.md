# PRODUCAO - Estoque, Retirada e Laticinios

## PROD-OPS-001 - Producao diaria consolida estoque com data padrao

- Contexto de negocio:
  O estoque diario representa volume consolidado disponivel para coleta do laticinio.

- Regra principal:
  CreateProducaoDiariaDto exige idPropriedade, idUsuario e quantidade positiva; dtRegistro e opcional e, quando ausente, deve usar now() no repositorio.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falhas de persistencia.

- Criterio de aceite:
  - DTO valida campos obrigatorios.
  - Repositorio define dtRegistro com sql`now()` quando valor nao e enviado.

- Rastreabilidade para codigo e testes:
  src/modules/producao/producao-diaria/dto/create-producao-diaria.dto.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/producao-diaria/repositories/producao-diaria.repository.drizzle.ts

- Status:
  implementada

## PROD-OPS-002 - Listagens de estoque seguem contrato paginado por dominio

- Contexto de negocio:
  Acompanhamento de estoque precisa pagina para evitar respostas grandes.

- Regra principal:
  findAll e findByPropriedade devem retornar dados + metadados via createPaginatedResponse.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em erro de consulta.

- Criterio de aceite:
  Service recebe PaginationDto e repassa page/limit ao repositorio.

- Rastreabilidade para codigo e testes:
  src/modules/producao/producao-diaria/producao-diaria.controller.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/producao-diaria/repositories/producao-diaria.repository.drizzle.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada

## PROD-OPS-003 - Registro de retirada vincula funcionario autenticado e valida FKs

- Contexto de negocio:
  Cada coleta precisa manter rastreabilidade de quem executou e garantir integridade referencial.

- Regra principal:
  RetiradaController extrai id_funcionario do token e RetiradaRepository cria coleta com idFuncionario, tratando violacao de FK com BadRequest especifico.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  - BadRequestException para funcionario, industria ou propriedade inexistente.
  - InternalServerErrorException para demais falhas.

- Criterio de aceite:
  Repositorio intercepta erro 23503 e converte para mensagens de dominio.

- Rastreabilidade para codigo e testes:
  src/modules/producao/retirada/retirada.controller.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/retirada/repositories/retirada.repository.drizzle.ts

- Status:
  implementada

## PROD-OPS-004 - Consulta de retirada por propriedade devolve historico e estatisticas

- Contexto de negocio:
  O produtor precisa acompanhar historico de coletas e qualidade dos testes por propriedade.

- Regra principal:
  findByPropriedade deve retornar lista paginada com nome da empresa e metadados incluindo totalAprovadas e totalRejeitadas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falha de consulta.

- Criterio de aceite:
  Service agrega dados de listagem + estatisticas de obterEstatisticasPorPropriedade no mesmo payload.

- Rastreabilidade para codigo e testes:
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/retirada/repositories/retirada.repository.drizzle.ts
  src/modules/producao/retirada/dto/retirada-propriedade.dto.ts

- Status:
  implementada

## PROD-OPS-005 - Cadastro de laticinios e master data vinculado a propriedade

- Contexto de negocio:
  O modulo precisa manter base de industrias para operacao de retirada.

- Regra principal:
  Laticinios deve permitir CRUD por id e listagem por propriedade usando entidade industria com soft delete.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para id inexistente e InternalServerErrorException para falhas de banco.

- Criterio de aceite:
  Controller expoe rotas de create/find/update/remove/restore e repositorio consulta tabela industria.

- Rastreabilidade para codigo e testes:
  src/modules/producao/laticinios/laticinios.controller.ts
  src/modules/producao/laticinios/laticinios.service.ts
  src/modules/producao/laticinios/repositories/laticinios.repository.drizzle.ts
  src/modules/producao/laticinios/dto/create-laticinios.dto.ts

- Status:
  implementada

## PROD-OPS-006 - Fluxos de restore possuem comportamento inconsistente para registros removidos

- Contexto de negocio:
  Restauracao de registros removidos e necessaria para correcao operacional sem perda historica.

- Regra principal:
  ProducaoDiariaService, RetiradaService e LaticiniosService tentam validar restore consultando buscarPorId antes de restaurar.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Como buscarPorId filtra somente registros com deletedAt null, a validacao inicial pode retornar NotFound para item realmente removido.

- Criterio de aceite:
  - buscarPorId dos tres repositorios usa isNull(deletedAt).
  - Services de restore dependem dessa busca para decidir se restaura.

- Rastreabilidade para codigo e testes:
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/producao-diaria/repositories/producao-diaria.repository.drizzle.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/retirada/repositories/retirada.repository.drizzle.ts
  src/modules/producao/laticinios/laticinios.service.ts
  src/modules/producao/laticinios/repositories/laticinios.repository.drizzle.ts

- Status:
  parcial
