# SAUDE-ZOOTECNIA - Dados Zootecnicos

## SZO-ZOO-001 - Registro zootecnico e vinculado a bufalo e usuario interno

- Contexto de negocio:
  Historico de mensuracao precisa rastreabilidade de quem registrou e para qual animal.

- Regra principal:
  Create deve receber id_bufalo, resolver id interno do usuario autenticado e persistir o registro com esse contexto.

- Excecoes:
  Data do registro e opcional (usa data atual quando nao informada).

- Erros esperados:
  Erros internos quando houver falha de persistencia.

- Criterio de aceite:
  Controller passa user.sub para service.create e repository grava idBufalo/idUsuario.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.controller.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/modules/saude-zootecnia/dados-zootecnicos/repositories/dados-zootecnicos.repository.drizzle.ts
  src/core/utils/user.helper.ts

- Status:
  implementada

## SZO-ZOO-002 - Listagens por bufalo e propriedade sao paginadas

- Contexto de negocio:
  Historico zootecnico pode crescer rapidamente e exige paginacao para leitura eficiente.

- Regra principal:
  Listagens por bufalo e por propriedade devem usar parametros de paginacao e retorno padronizado com metadados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Service usa calculatePaginationParams/createPaginatedResponse com PaginationDto nas rotas de listagem.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.controller.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada

## SZO-ZOO-003 - Registro suporta soft delete e endpoint de restore

- Contexto de negocio:
  Correcao de informacao zootecnica precisa remocao logica sem perda imediata de historico.

- Regra principal:
  Remove deve marcar deletedAt e restore deve reativar registro removido.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para registro inexistente; BadRequestException para restore invalido.

- Criterio de aceite:
  Service implementa ISoftDelete e repository possui softDelete/restore/findAllWithDeleted.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/modules/saude-zootecnia/dados-zootecnicos/repositories/dados-zootecnicos.repository.drizzle.ts

- Status:
  implementada

## SZO-ZOO-004 - Restore usa busca apenas de registros ativos

- Contexto de negocio:
  Fluxo de restauracao depende de localizar o registro removido para validar seu estado.

- Regra principal:
  Restore deveria consultar registro incluindo removidos antes de verificar deletedAt.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, restore chama findById que filtra deletedAt nulo e pode impedir restauracao real.

- Criterio de aceite:
  Service.restore usa repository.findById e esse metodo aplica isNull(deletedAt).

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/modules/saude-zootecnia/dados-zootecnicos/repositories/dados-zootecnicos.repository.drizzle.ts

- Status:
  parcial

## SZO-ZOO-005 - Consulta por propriedade nao valida ownership com helper central

- Contexto de negocio:
  Em ambiente multi-tenant, informar id_propriedade nao pode ser suficiente para conceder acesso aos dados.

- Regra principal:
  Consulta por propriedade deveria validar escopo do usuario com helper central de autorizacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, listagem por propriedade nao faz verificacao explicita de ownership por usuario.

- Criterio de aceite:
  Fluxo findAllByPropriedade nao usa AuthHelperService/PropertyExistsGuard.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.controller.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/core/services/auth-helper.service.ts
  src/core/guards/property-exists.guard.ts

- Status:
  parcial
