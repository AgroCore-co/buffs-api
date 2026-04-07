# PRODUCAO - Integracao com Core

## PROD-CORE-001 - Submodulos importam infraestrutura compartilhada obrigatoria

- Contexto de negocio:
  Operacao segura do dominio exige autenticacao, acesso a banco e logging estruturado.

- Regra principal:
  Submodulos de producao devem importar AuthModule, LoggerModule e DatabaseModule (com variacoes por necessidade).

- Excecoes:
  Ordenha e Lactacao importam modulos adicionais de dominio (Alerta, Rebanho, GestaoPropriedade).

- Erros esperados:
  Falha de DI quando infraestrutura nao estiver registrada.

- Criterio de aceite:
  Modules do dominio possuem imports explicitos de infraestrutura compartilhada.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.module.ts
  src/modules/producao/lactacao/lactacao.module.ts
  src/modules/producao/producao-diaria/producao-diaria.module.ts
  src/modules/producao/retirada/retirada.module.ts
  src/modules/producao/laticinios/laticinios.module.ts
  src/modules/producao/predicao-producao/predicao-producao.module.ts

- Status:
  implementada

## PROD-CORE-002 - Persistencia usa DatabaseService e padrao Drizzle em todos os repositorios

- Contexto de negocio:
  Consistencia de acesso a dados reduz divergencia de comportamento entre subdominios.

- Regra principal:
  Repositorios de ordenha, lactacao, producao diaria, retirada e laticinios injetam DatabaseService e aplicam filtro de ativos por deletedAt quando necessario.

- Excecoes:
  Predicao nao possui repositorio proprio, pois integra servico HTTP externo.

- Erros esperados:
  InternalServerErrorException propagada pelos services quando repositorio falha.

- Criterio de aceite:
  Todos os repositorios usam this.databaseService.db ou this.db.db com operadores do Drizzle.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/repositories/ordenha.repository.drizzle.ts
  src/modules/producao/lactacao/repositories/lactacao.repository.drizzle.ts
  src/modules/producao/producao-diaria/repositories/producao-diaria.repository.drizzle.ts
  src/modules/producao/retirada/repositories/retirada.repository.drizzle.ts
  src/modules/producao/laticinios/repositories/laticinios.repository.drizzle.ts
  src/core/database/database.service.ts

- Status:
  implementada

## PROD-CORE-003 - Logging do modulo e funcional, porem heterogeneo

- Contexto de negocio:
  Observabilidade uniforme simplifica auditoria e troubleshooting de falhas operacionais.

- Regra principal:
  Controllers e services usam majoritariamente LoggerService do Core para log de request e erro.

- Excecoes:
  PredicaoProducaoService usa Logger nativo do Nest; alguns services registram nome de modulo inconsistente (ex.: IndustriaService em LaticiniosService).

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  - LoggerService aparece em controllers/services dos subdominios transacionais.
  - Predicao usa Logger do Nest em vez do logger compartilhado.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.controller.ts
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/laticinios/laticinios.service.ts
  src/modules/producao/predicao-producao/predicao-producao.service.ts
  src/core/logger/logger.service.ts

- Status:
  parcial

## PROD-CORE-004 - Contrato de paginacao do Core e reaproveitado de forma parcial

- Contexto de negocio:
  Padrao unico de paginacao evita divergencia de resposta entre endpoints de listagem.

- Regra principal:
  Lactacao, ProducaoDiaria e Retirada usam PaginationDto + createPaginatedResponse.

- Excecoes:
  Ordenha usa page/limit simples e resposta customizada em vez de contrato paginado unico.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Reuso explicito dos utilitarios de paginacao em parte dos subdominios e formato manual em ordenha.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/ordenha/ordenha.service.ts
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts

- Status:
  parcial

## PROD-CORE-005 - Estrategia de cache HTTP e heterogenea entre subdominios

- Contexto de negocio:
  Endpoints de consulta e IA podem se beneficiar de cache, mas precisam padrao claro para consistencia.

- Regra principal:
  Lactacao, Retirada e Predicao aplicam CacheInterceptor com TTLs; Ordenha, ProducaoDiaria e Laticinios nao aplicam a mesma estrategia.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existencia de TTL configurado em alguns controllers e ausencia em outros do mesmo dominio.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/lactacao.controller.ts
  src/modules/producao/retirada/retirada.controller.ts
  src/modules/producao/predicao-producao/predicao-producao.controller.ts
  src/modules/producao/ordenha/ordenha.controller.ts
  src/modules/producao/producao-diaria/producao-diaria.controller.ts
  src/modules/producao/laticinios/laticinios.controller.ts

- Status:
  parcial

## PROD-CORE-006 - Validacao de acesso por propriedade reaproveita Core apenas em parte do modulo

- Contexto de negocio:
  Seguranca multi-tenant depende de validacao centralizada de ownership por propriedade.

- Regra principal:
  AuthHelperService e usado em ordenha para extrair usuario e validar acesso por propriedade em fluxos especificos.

- Excecoes:
  Lactacao, ProducaoDiaria, Retirada e Laticinios nao aplicam validacao equivalente em todas as operacoes expostas.

- Erros esperados:
  No estado atual, endpoints podem aceitar id_propriedade sem checagem uniforme de ownership.

- Criterio de aceite:
  Diferenca clara entre uso de validatePropriedadeAccess em ordenha e ausencia de padrao nos demais services.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/laticinios/laticinios.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## PROD-CORE-007 - Interface ISoftDelete e reusada no dominio inteiro

- Contexto de negocio:
  Operacao de remocao logica precisa padrao unico para auditoria e recuperacao.

- Regra principal:
  Services transacionais do modulo implementam ISoftDelete e repositorios operam campo deletedAt.

- Excecoes:
  PredicaoProducaoService nao implementa ISoftDelete por nao possuir entidade persistida.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  OrdenhaService, LactacaoService, ProducaoDiariaService, RetiradaService e LaticiniosService implementam ISoftDelete.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts
  src/modules/producao/retirada/retirada.service.ts
  src/modules/producao/laticinios/laticinios.service.ts
  src/core/interfaces/soft-delete.interface.ts

- Status:
  implementada

## PROD-CORE-008 - Validadores compartilhados de data sao reutilizados no contrato do modulo

- Contexto de negocio:
  Regra temporal de nao-futuro e sequenciamento de datas deve ser consistente em todo o dominio.

- Regra principal:
  DTOs de ordenha, lactacao, producao diaria e retirada reaproveitam validadores IsNotFutureDate/IsAfterDate do Core.

- Excecoes:
  Laticinios nao possui campos de data de negocio no DTO de create.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Importacao direta de validadores do Core nos DTOs do modulo.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/dto/create-ordenha.dto.ts
  src/modules/producao/lactacao/dto/create-lactacao.dto.ts
  src/modules/producao/producao-diaria/dto/create-producao-diaria.dto.ts
  src/modules/producao/retirada/dto/create-retirada.dto.ts
  src/core/validators/date.validators.ts

- Status:
  implementada
