# REPRODUCAO - Integracao com Core

## REPRO-CORE-001 - Submodulos importam infraestrutura compartilhada do Core

- Contexto de negocio:
  Dominio reprodutivo depende de autenticacao, banco, logging e cache para operacao segura e escalavel.

- Regra principal:
  Cobertura, MaterialGenetico, Genealogia e Simulacao devem declarar imports de modulos compartilhados (Auth, Database, Logger, Cache quando aplicavel).

- Excecoes:
  Simulacao depende tambem de BufaloModule (dominio rebanho) para validacao de animais.

- Erros esperados:
  Falha de DI se dependencias de infraestrutura nao forem registradas.

- Criterio de aceite:
  Modulos de reproducao possuem imports explicitos de infraestrutura.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.module.ts
  src/modules/reproducao/material-genetico/material-genetico.module.ts
  src/modules/reproducao/genealogia/genealogia.module.ts
  src/modules/reproducao/simulacao/simulacao.module.ts

- Status:
  implementada

## REPRO-CORE-002 - DatabaseService e base transversal do modulo

- Contexto de negocio:
  Persistencia e consultas de regras reprodutivas precisam de acesso padronizado ao banco.

- Regra principal:
  Repositories e services centrais do modulo usam DatabaseService para CRUD e consultas especializadas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em repositories para falhas de query/CRUD.

- Criterio de aceite:
  CoberturaRepositoryDrizzle, MaterialGeneticoRepositoryDrizzle e GenealogiaRepositoryDrizzle injetam DatabaseService.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/repositories/cobertura.repository.drizzle.ts
  src/modules/reproducao/material-genetico/repositories/material-genetico.repository.drizzle.ts
  src/modules/reproducao/genealogia/repositories/genealogia.repository.drizzle.ts
  src/core/database/database.service.ts

- Status:
  implementada

## REPRO-CORE-003 - Contratos de paginacao do Core sao reutilizados em cobertura e material genetico

- Contexto de negocio:
  Padrao unico de paginacao reduz divergencia de contrato entre endpoints de listagem.

- Regra principal:
  CoberturaService e MaterialGeneticoService usam PaginationDto + utilitarios calculatePaginationParams/createPaginatedResponse.

- Excecoes:
  Genealogia e simulacao nao expoem paginacao no estado atual.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Listagens retornam estrutura paginada padronizada via utilitarios do Core.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada

## REPRO-CORE-004 - Reuso de validadores e interfaces do Core aparece em pontos-chave

- Contexto de negocio:
  Evitar duplicacao de regra base (datas e soft delete) melhora consistencia de dominio.

- Regra principal:
  - DTOs de cobertura/material reutilizam IsNotFutureDate.
  - Services de cobertura/material implementam ISoftDelete.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Importacao direta de validator e interface compartilhada no modulo.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/dto/create-cobertura.dto.ts
  src/modules/reproducao/material-genetico/dto/create-material-genetico.dto.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/core/validators/date.validators.ts
  src/core/interfaces/soft-delete.interface.ts

- Status:
  implementada

## REPRO-CORE-005 - Integracao de cache do Core e heterogenea no modulo

- Contexto de negocio:
  Endpoints com custo alto de consulta e IA se beneficiam de cache, mas exigem estrategia coerente entre subdominios.

- Regra principal:
  Genealogia aplica cache HTTP com TTL explicito, enquanto cobertura/material/simulacao nao aplicam a mesma estrategia de forma equivalente.

- Excecoes:
  CoberturaModule importa CacheConfigModule e CoberturaService injeta CacheService, mas sem uso efetivo no fluxo atual.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  - GenealogiaController usa CacheInterceptor + CacheTTL.
  - CoberturaService possui injecao de CacheService sem chamadas no codigo.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.controller.ts
  src/modules/reproducao/cobertura/cobertura.module.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/core/cache/cache.service.ts

- Status:
  parcial

## REPRO-CORE-006 - Validacao de ownership reutiliza recursos compartilhados no modulo

- Contexto de negocio:
  Seguranca multi-tenant depende de validacao consistente de vinculo usuario x propriedade.

- Regra principal:
  Subdominios de reproducao reutilizam recursos compartilhados para ownership conforme contexto do fluxo.

- Excecoes:
  Genealogia mantem estrategia baseada em UserMappingService + vinculo usuario/propriedade.

- Erros esperados:
  Erro de acesso quando usuario nao possui vinculo com a propriedade, alem de NotFoundException para registros sem propriedade vinculada.

- Criterio de aceite:
  - Cobertura e material-genetico usam AuthHelperService (getUserId, validatePropriedadeAccess, getUserPropriedades).
  - Controllers de cobertura/material propagam @User para a camada de servico.
  - Genealogia preserva fluxo de ownership com servicos/repositorios compartilhados de usuario/propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.service.ts
  src/modules/reproducao/cobertura/cobertura.controller.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/material-genetico/material-genetico.controller.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/modules/reproducao/cobertura/cobertura.service.spec.ts
  src/modules/reproducao/material-genetico/material-genetico.service.spec.ts
  src/core/services/user-mapping.service.ts

- Status:
  implementada

## REPRO-CORE-007 - Estrategia de logging e padronizada no modulo

- Contexto de negocio:
  Observabilidade uniforme facilita auditoria de reproducoes, rastreio de falhas e operacao em producao.

- Regra principal:
  Subdominios principais de reproducao convergiram para LoggerService do Core e removeram uso direto de console para logs operacionais.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  - CoberturaService, MaterialGeneticoService, SimulacaoService e GenealogiaIAService usam LoggerService.
  - Utilitarios de query de cobertura aceitam LoggerService opcional para registrar falhas sem fallback silencioso.
  - Nao ha logging operacional com console.* nesses fluxos.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/utils/reproducao-queries-drizzle.util.ts
  src/modules/reproducao/simulacao/simulacao.service.ts
  src/modules/reproducao/genealogia/genealogia-ia.service.ts
  src/core/logger/logger.service.ts

- Status:
  implementada
