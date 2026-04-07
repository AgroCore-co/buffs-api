# Template de Regra SDD

## [ID-DA-REGRA] - [TITULO CURTO]

- Contexto de negocio:
  Descreva o problema de negocio que esta regra resolve.

- Regra principal:
  Defina o comportamento esperado, de forma objetiva e testavel.

- Excecoes:
  Liste cenarios onde a regra nao se aplica ou muda de comportamento.

- Erros esperados:
  Informe erros de dominio ou HTTP esperados quando a regra for violada.

- Criterio de aceite:
  Liste condicoes de verificacao para validar que a regra esta correta.

- Rastreabilidade para codigo e testes:
  Arquivos/funcoes que implementam e validam a regra.

- Status:
  implementada | parcial | pendente

---

## Exemplo rapido

## CORE-CACHE-001 - Cache de propriedades do usuario

- Contexto de negocio:
  Evitar carga excessiva em consultas repetidas de autorizacao.

- Regra principal:
  As propriedades do usuario devem usar cache de curta duracao.

- Excecoes:
  Sem excecoes funcionais.

- Erros esperados:
  Nao deve quebrar requisicao se cache falhar.

- Criterio de aceite:
  Requisicoes repetidas em janela curta reduzem consultas em banco.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/core/cache/cache.constants.ts

- Status:
  implementada
