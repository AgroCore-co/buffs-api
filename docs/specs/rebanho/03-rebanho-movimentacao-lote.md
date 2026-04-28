# REBANHO - Movimentacao de Lote

## REB-MOV-001 - Movimentacao encerra registro ativo anterior e abre novo destino

- Contexto de negocio:
  Historico de deslocamento de grupo entre lotes precisa manter permanencia e sequencia temporal.

- Regra principal:
  Ao criar movimentacao, sistema deve localizar registro ativo do grupo, fechar dtSaida e inserir novo registro com dtEntrada no lote de destino.

- Excecoes:
  Se for primeira movimentacao do grupo, nao ha registro anterior para fechar.

- Erros esperados:
  BadRequestException para inconsistencias de data ou lote invalido.

- Criterio de aceite:
  Fluxo create chama findRegistroAtual, fecha registro anterior e cria novo movimento.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/modules/rebanho/mov-lote/repositories/mov-lote.repository.drizzle.ts

- Status:
  implementada

## REB-MOV-002 - Lote origem e destino nao podem ser iguais

- Contexto de negocio:
  Registrar movimentacao para o mesmo lote gera ruido operacional sem evento fisico real.

- Regra principal:
  Criacao/atualizacao deve rejeitar quando idLoteAnterior e idLoteAtual forem iguais.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException para lote de origem e destino identicos.

- Criterio de aceite:
  Validacao e executada em validateReferences e reforcada no fluxo create, incluindo updates parciais com contexto do registro atual.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/modules/rebanho/mov-lote/dto/create-mov-lote.dto.ts

- Status:
  implementada

## REB-MOV-003 - Lote anterior pode ser auto-detectado quando nao informado

- Contexto de negocio:
  Operador pode nao conhecer o lote anterior no momento do registro, mas o sistema possui estado atual do grupo.

- Regra principal:
  Quando idLoteAnterior nao for enviado e houver registro ativo, sistema deve usar o lote atual encontrado como origem.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Create preenche idLoteAnterior automaticamente a partir de registroAtual.idLoteAtual.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts

- Status:
  implementada

## REB-MOV-004 - Historico e status atual por grupo sao consultaveis

- Contexto de negocio:
  Gestao de pasto precisa saber trilha de movimentacao e local atual de cada grupo.

- Regra principal:
  API deve retornar historico completo por grupo e status atual (lote atual + dias no local).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException quando grupo nao possui movimentacoes no endpoint de status atual.

- Criterio de aceite:
  Endpoints historico/grupo/:id_grupo e status/grupo/:id_grupo retornam payload consolidado.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.controller.ts
  src/modules/rebanho/mov-lote/mov-lote.service.ts

- Status:
  implementada

## REB-MOV-005 - Remocao de movimentacao usa soft delete

- Contexto de negocio:
  Movimentacao representa historico operacional e precisa preservar trilha de auditoria.

- Regra principal:
  Remocao deve marcar deletedAt sem exclusao fisica, mantendo historico.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Repository remove faz update de deletedAt/updatedAt e consultas desconsideram registros removidos.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/modules/rebanho/mov-lote/repositories/mov-lote.repository.drizzle.ts

- Status:
  implementada

## REB-MOV-006 - Ownership por propriedade e validado com helper central

- Contexto de negocio:
  Movimentacao por idPropriedade precisa bloquear acesso fora do escopo do usuario autenticado.

- Regra principal:
  Operacoes de movimentacao devem validar vinculo usuario-propriedade usando helper central de autorizacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para propriedade/recursos fora do escopo do usuario; BadRequestException para referencias inconsistentes entre propriedade, grupo e lote.

- Criterio de aceite:
  MovLoteService usa AuthHelperService (getUserId/validatePropriedadeAccess) em create/read/update/delete/historico/status, e rota por propriedade aplica PropertyExistsGuard.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/modules/rebanho/mov-lote/mov-lote.controller.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## REB-MOV-007 - Endpoint findAll respeita escopo do usuario

- Contexto de negocio:
  Endpoint de listagem geral deveria refletir todos os registros permitidos ao usuario.

- Regra principal:
  FindAll deve listar somente movimentacoes das propriedades vinculadas ao usuario autenticado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Implementacao de findAll usa getUserPropriedades e consulta por lista de propriedades no repositorio.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts

- Status:
  implementada
