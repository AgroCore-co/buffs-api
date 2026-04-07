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

## REPRO-CORE-006 - Validacao de ownership usa recursos compartilhados apenas em parte do modulo

- Contexto de negocio:
  Seguranca multi-tenant depende de validacao consistente de vinculo usuario x propriedade.

- Regra principal:
  Todos os subdominios deveriam reaproveitar helpers/repositorios centrais para ownership.

- Excecoes:
  Genealogia ja usa UserMappingService, UsuarioPropriedadeRepository e helper de propriedade.

- Erros esperados:
  No estado atual, cobertura e material-genetico nao aplicam validacao de ownership com helper compartilhado na camada de negocio.

- Criterio de aceite:
  Diferenca clara entre abordagem robusta em genealogia e ausencia de validacao equivalente em cobertura/material.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.service.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/core/services/user-mapping.service.ts

- Status:
  parcial

## REPRO-CORE-007 - Estrategia de logging nao e padronizada no modulo

- Contexto de negocio:
  Observabilidade uniforme facilita auditoria de reproducoes, rastreio de falhas e operacao em producao.

- Regra principal:
  Modulo deveria convergir para LoggerService do Core para log estruturado.

- Excecoes:
  MaterialGeneticoService ja utiliza LoggerService.

- Erros esperados:
  No estado atual, cobertura usa console.log/warn/error e simulacao/genealogia-ia usam Logger nativo do Nest, gerando heterogeneidade.

- Criterio de aceite:
  Coexistem tres abordagens de logging no modulo (Core LoggerService, Nest Logger e console).

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/simulacao/simulacao.service.ts
  src/modules/reproducao/genealogia/genealogia-ia.service.ts
  src/core/logger/logger.service.ts

- Status:
  parcial
