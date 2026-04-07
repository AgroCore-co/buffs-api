# REBANHO - Bufalos

## REB-BUF-001 - Cadastro calcula maturidade e categoria automaticamente

- Contexto de negocio:
  Cadastro de animal precisa consistencia zootecnica minima sem depender de calculo manual em cada cliente.

- Regra principal:
  No create, o service calcula nivel de maturidade com base em data de nascimento/sexo e pode calcular categoria ABCB quando ha genealogia.

- Excecoes:
  Se nao houver dados suficientes para calculo de categoria, o fluxo segue sem atualizar categoria por arvore.

- Erros esperados:
  BadRequestException para inconsistencias de genealogia; erros internos para falha de persistencia.

- Criterio de aceite:
  Create chama processarDadosMaturidade e processarCategoriaABCB (quando aplicavel) antes de persistir.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/bufalo/services/bufalo-maturidade.service.ts
  src/modules/rebanho/bufalo/services/bufalo-categoria.service.ts

- Status:
  implementada

## REB-BUF-002 - Acesso a bufalos e protegido por ownership de propriedade

- Contexto de negocio:
  Em multi-tenant, usuario autenticado so pode operar animais de propriedades vinculadas.

- Regra principal:
  Operacoes de leitura/escrita de bufalo devem validar acesso a propriedade por AuthHelperService antes da acao principal.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException quando animal/propriedade nao existir ou estiver fora do escopo do usuario.

- Criterio de aceite:
  BufaloService usa getUserId, getUserPropriedades e validatePropriedadeAccess nos fluxos criticos.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## REB-BUF-003 - Genealogia impede circularidade e auto-referencia

- Contexto de negocio:
  Relacao de parentesco invalida compromete categoria ABCB, relatorios e decisao de manejo.

- Regra principal:
  Sistema deve bloquear pai/mae iguais ao proprio animal, pai igual a mae e atribuicao de ascendentes que sejam descendentes do animal.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException para qualquer violacao de circularidade.

- Criterio de aceite:
  Validacao de genealogia e executada em create/update quando campos de parentesco sao informados.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/bufalo/repositories/bufalo.repository.drizzle.ts
  src/modules/rebanho/bufalo/bufalo.service.spec.ts

- Status:
  implementada

## REB-BUF-004 - Consultas de bufalo usam filtro unificado com paginacao e enriquecimento

- Contexto de negocio:
  Operacao de campo precisa filtros combinados com desempenho e resposta consistente.

- Regra principal:
  Listagens devem usar fluxo unificado de filtros + paginacao + atualizacao de maturidade + enriquecimento de campos derivados (nomeRaca, brincoPai/brincoMae etc.).

- Excecoes:
  Busca por microchip retorna item unico e nao usa resposta paginada.

- Erros esperados:
  NotFoundException quando microchip nao pertence ao escopo do usuario.

- Criterio de aceite:
  Metodos findBy* delegam para buscarComFiltrosPaginado e BufaloFiltrosService; resposta paginada usa utilitario central.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/bufalo/services/bufalo-filtros.service.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada

## REB-BUF-005 - Inativacao formal exige data e motivo e permite reativacao

- Contexto de negocio:
  Baixa de animal precisa rastreabilidade de causa para auditoria e analise zootecnica.

- Regra principal:
  Endpoint de inativacao deve registrar status=false, dataBaixa e motivoInativo; endpoint de reativacao deve limpar esses campos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException para inativar animal ja inativo, reativar animal ja ativo ou data de baixa invalida.

- Criterio de aceite:
  Inativar e reativar atualizam campos especificos no repository e retornam payload formatado.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.controller.ts
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/bufalo/repositories/bufalo.repository.drizzle.ts

- Status:
  implementada

## REB-BUF-006 - Soft delete bloqueia exclusao de animal com descendentes

- Contexto de negocio:
  Excluir logicamente um ancestral quebraria consultas de genealogia e rastreabilidade.

- Regra principal:
  Antes do soft delete, sistema deve impedir remocao quando houver filhos vinculados ao animal.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException quando o animal tiver descendentes.

- Criterio de aceite:
  Fluxo remove/softDelete verifica hasOffspring antes de marcar deletedAt.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/bufalo/repositories/bufalo.repository.drizzle.ts

- Status:
  implementada

## REB-BUF-007 - Mudanca de grupo em lote processa multiplos animais de uma vez

- Contexto de negocio:
  Reorganizacao de manejo costuma afetar varios animais no mesmo evento operacional.

- Regra principal:
  Endpoint de mover grupo deve aceitar lista de IDs de bufalo, validar acesso e aplicar update em lote para novo grupo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException/BadRequestException em caso de acesso invalido ou payload inconsistente.

- Criterio de aceite:
  updateGrupo valida acesso para cada animal e chama updateMany com idNovoGrupo.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.controller.ts
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/bufalo/dto/update-grupo-bufalo.dto.ts

- Status:
  implementada

## REB-BUF-008 - Restauracao de soft delete esta inconsistente com busca de ativo

- Contexto de negocio:
  Processo de restauracao precisa localizar registros removidos logicamente para reabilitar o animal.

- Regra principal:
  Fluxo de restore deveria consultar registro inclusive deletado antes de validar estado removido.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, restore tende a retornar not found ou nao removido porque a busca base (findById) filtra deletedAt nulo.

- Criterio de aceite:
  Implementacao atual de restore depende de findById (somente ativos), gerando inconsistencia para restaurar animal removido.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.ts
  src/modules/rebanho/bufalo/repositories/bufalo.repository.drizzle.ts

- Status:
  parcial