# CORE - Cache

## CORE-CACHE-001 - Configuracao global de cache com TTL padrao

- Contexto de negocio:
  Operacoes repetitivas precisam reduzir latencia sem espalhar configuracao por modulo.

- Regra principal:
  O cache deve ser global, com TTL padrao de 5 minutos e capacidade maior em producao.

- Excecoes:
  TTLs especificos podem sobrescrever o padrao em casos justificados.

- Erros esperados:
  Falha de cache nao deve derrubar a requisicao de negocio.

- Criterio de aceite:
  App sobe com CacheModule global e TTL default aplicado.

- Rastreabilidade para codigo e testes:
  src/core/cache/cache.module.ts

- Status:
  implementada

## CORE-CACHE-002 - Cache de propriedades do usuario com TTL curto

- Contexto de negocio:
  Validacao de acesso a propriedade e chamada em alta frequencia.

- Regra principal:
  Propriedades do usuario devem usar chave padronizada e TTL curto de 30 segundos.

- Excecoes:
  Alteracao de vinculo deve invalidar chave para evitar autorizacao stale.

- Erros esperados:
  Usuario sem propriedades vinculadas deve gerar erro de dominio.

- Criterio de aceite:
  Consulta repetida em janela curta reaproveita cache e pode ser invalidada por evento de vinculo.

- Rastreabilidade para codigo e testes:
  src/core/cache/cache.constants.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## CORE-CACHE-003 - Comportamento fail-soft do CacheService

- Contexto de negocio:
  Cache e otimizacao. Nao pode ser ponto unico de falha do negocio.

- Regra principal:
  Em erro de cache, o sistema deve logar aviso e seguir com fallback sem quebrar fluxo principal.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Apenas logs de warn, sem excecao propagada para chamadas de leitura/escrita comuns.

- Criterio de aceite:
  Falha em get/set/del nao interrompe processamento da regra de negocio.

- Rastreabilidade para codigo e testes:
  src/core/cache/cache.service.ts

- Status:
  implementada
