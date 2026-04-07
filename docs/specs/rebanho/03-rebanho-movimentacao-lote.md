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
  Validacao e executada em validateReferences e reforcada no fluxo create.

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

## REB-MOV-005 - Remocao de movimentacao e hard delete

- Contexto de negocio:
  Movimentacao representa historico operacional; remocao fisica pode afetar trilha de auditoria.

- Regra principal:
  No estado atual, remove executa exclusao fisica do registro (hard delete), diferente de outros subdominios que usam soft delete.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Repository remove usa delete direto na tabela movlote.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/modules/rebanho/mov-lote/repositories/mov-lote.repository.drizzle.ts

- Status:
  parcial

## REB-MOV-006 - Ownership por propriedade nao e validado com helper central

- Contexto de negocio:
  Movimentacao por idPropriedade precisa bloquear acesso fora do escopo do usuario autenticado.

- Regra principal:
  Operacoes de movimentacao deveriam validar vinculo usuario-propriedade usando helper central de autorizacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, create usa usuario apenas para log e validacoes focam existencia de referencias, nao ownership.

- Criterio de aceite:
  MovLoteService nao usa AuthHelperService/PropertyExistsGuard para validar escopo de propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts
  src/modules/rebanho/mov-lote/mov-lote.controller.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## REB-MOV-007 - Endpoint findAll nao representa listagem global real

- Contexto de negocio:
  Endpoint de listagem geral deveria refletir todos os registros permitidos ao usuario.

- Regra principal:
  No estado atual, findAll delega para findByPropriedade com id_propriedade vazio, o que tende a retornar escopo incompleto.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Implementacao atual de findAll chama findByPropriedade('', 1, 100) no service.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/mov-lote.service.ts

- Status:
  parcial
