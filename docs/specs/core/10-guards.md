# CORE - Guards

## CORE-GUARD-001 - Validacao de existencia da propriedade por parametro

- Contexto de negocio:
  Fluxos que recebem id_propriedade em rota devem falhar cedo quando o recurso nao existe.

- Regra principal:
  Guard de propriedade deve consultar o banco e bloquear requisicao com 404 quando id nao existir.

- Excecoes:
  Quando id_propriedade nao estiver presente no parametro, guard nao bloqueia o fluxo.

- Erros esperados:
  NotFoundException com mensagem de propriedade nao encontrada.

- Criterio de aceite:
  Parametro valido passa; parametro inexistente retorna 404.

- Rastreabilidade para codigo e testes:
  src/core/guards/property-exists.guard.ts

- Status:
  implementada

## CORE-GUARD-002 - Consulta enxuta para validacao de existencia

- Contexto de negocio:
  Guard deve validar existencia com menor custo possivel.

- Regra principal:
  Validacao deve consultar apenas coluna de identificacao (idPropriedade).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Query do guard seleciona somente idPropriedade.

- Rastreabilidade para codigo e testes:
  src/core/guards/property-exists.guard.ts

- Status:
  implementada
