# CORE - Interfaces

## CORE-INT-001 - Contrato padrao para soft delete

- Contexto de negocio:
  Diversos modulos usam remocao logica e precisam de API consistente.

- Regra principal:
  Servicos com soft delete devem implementar metodos softDelete e restore.

- Excecoes:
  findAllWithDeleted e opcional, conforme necessidade de cada modulo.

- Erros esperados:
  Sem comportamento padronizado de erro nesta interface; erros sao definidos pelo servico implementador.

- Criterio de aceite:
  Servicos aderentes ao contrato expoem softDelete/restore com assinatura compativel.

- Rastreabilidade para codigo e testes:
  src/core/interfaces/soft-delete.interface.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/rebanho/raca/raca.service.ts

- Status:
  implementada

## CORE-INT-002 - Semantica de remocao logica

- Contexto de negocio:
  Historico e recuperacao de dados sao requisitos comuns no dominio.

- Regra principal:
  Soft delete deve representar marcacao de removido, sem exclusao fisica imediata.

- Excecoes:
  Modulos sem requisito de restauracao podem nao expor findAllWithDeleted.

- Erros esperados:
  Servico pode rejeitar restore quando registro nao estiver removido.

- Criterio de aceite:
  Registro removido nao aparece em listagem padrao e pode ser restaurado quando suportado.

- Rastreabilidade para codigo e testes:
  src/core/interfaces/soft-delete.interface.ts
  src/modules/reproducao/cobertura/cobertura.service.ts

- Status:
  implementada
