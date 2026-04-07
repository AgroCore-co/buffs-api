# GESTAO-PROPRIEDADE - Lotes

## GPROP-LOT-001 - Lotes restritos a proprietario autenticado

- Contexto de negocio:
  Gestao de lotes/piquetes altera estrutura da propriedade e requer permissao elevada.

- Regra principal:
  Rotas de /lotes devem exigir SupabaseAuthGuard + RolesGuard com cargo PROPRIETARIO.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token invalido/ausente; 403 para cargo sem permissao.

- Criterio de aceite:
  Controller aplica guards em nivel de classe e role PROPRIETARIO.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/lote/lote.controller.ts

- Status:
  implementada

## GPROP-LOT-002 - Criacao e leitura validam acesso a propriedade alvo

- Contexto de negocio:
  Usuario nao deve criar/consultar lotes em propriedade fora do seu escopo.

- Regra principal:
  Service deve usar validatePropriedadeAccess para create e listagem por propriedade, e validar acesso na consulta individual de lote.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para lote inexistente ou sem acesso.

- Criterio de aceite:
  create/findAllByPropriedade/findOne validam escopo de propriedade antes de retornar dados.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## GPROP-LOT-003 - Grupo associado deve pertencer a mesma propriedade do lote

- Contexto de negocio:
  Vincular lote com grupo de outra propriedade cria incoerencia de dados no manejo.

- Regra principal:
  Quando idGrupo for informado, service deve validar existencia do grupo e compatibilidade com idPropriedade.

- Excecoes:
  Sem idGrupo, validacao nao e aplicada.

- Erros esperados:
  NotFoundException para grupo inexistente; BadRequestException para grupo de outra propriedade.

- Criterio de aceite:
  Service usa validateGrupoOwnership em create e update.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/modules/rebanho/grupo/repositories/grupo.repository.drizzle.ts

- Status:
  implementada

## GPROP-LOT-004 - Remocao de lote usa soft delete

- Contexto de negocio:
  Historico de lotes deve ser preservado para rastreabilidade operacional.

- Regra principal:
  DELETE /lotes/:id deve marcar deletedAt em vez de apagar fisicamente.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para lote inexistente ou sem acesso.

- Criterio de aceite:
  Repositorio atualiza deletedAt e consultas de lote filtram isNull(deletedAt).

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/lote/repositories/lote.repository.drizzle.ts
  src/database/schema.ts

- Status:
  implementada

## GPROP-LOT-005 - Contrato de geo_mapa convertido para objeto na resposta

- Contexto de negocio:
  Frontend de mapas precisa consumir geometria em formato de objeto parseado.

- Regra principal:
  Service deve tentar parsear geo_mapa quando vier como string e retornar payload apropriado para consumo do cliente.

- Excecoes:
  Se parse falhar, valor pode ser mantido como string com log de warning.

- Erros esperados:
  Nao aplicavel como erro de negocio.

- Criterio de aceite:
  parseGeoMapa e aplicado em create/findAll/findOne/update.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/modules/gestao-propriedade/lote/repositories/lote.repository.drizzle.ts

- Status:
  implementada

## GPROP-LOT-006 - Mudanca de propriedade sem revalidar grupo atual pode gerar inconsistencia

- Contexto de negocio:
  Alterar idPropriedade mantendo idGrupo antigo pode deixar lote vinculado a grupo de outra propriedade.

- Regra principal:
  Em update com troca de idPropriedade e sem novo idGrupo, fluxo deveria validar se grupo atual do lote continua compativel.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException quando grupo final ficar fora da propriedade final.

- Criterio de aceite:
  No estado atual, validacao de grupo no update so ocorre quando idGrupo e enviado no payload.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/modules/gestao-propriedade/lote/repositories/lote.repository.drizzle.ts

- Status:
  parcial
