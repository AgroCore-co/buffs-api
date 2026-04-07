# SAUDE-ZOOTECNIA - Integracao com Core

## SZO-CORE-001 - Modulos de saude reutilizam infraestrutura compartilhada do Core

- Contexto de negocio:
  Operacoes de saude exigem padrao de acesso a banco, autenticacao e logging transversal.

- Regra principal:
  Submodulos de saude devem importar DatabaseModule, AuthModule e LoggerModule.

- Excecoes:
  Dados sanitarios tambem importa AlertasModule para automacao de notificacao clinica.

- Erros esperados:
  Falha de DI quando providers compartilhados nao estiverem disponiveis.

- Criterio de aceite:
  Modulos de dados-sanitarios, dados-zootecnicos, medicamentos e vacinacao importam infraestrutura compartilhada.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.module.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.module.ts
  src/modules/saude-zootecnia/medicamentos/medicamentos.module.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.module.ts

- Status:
  implementada

## SZO-CORE-002 - LoggerService e DatabaseService sao usados em toda a camada de dominio

- Contexto de negocio:
  Dominio clinico exige trilha de erro e persistencia padronizada para diagnostico operacional.

- Regra principal:
  Services/controladores usam LoggerService e repositories usam DatabaseService.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falhas de banco tratadas na camada repository.

- Criterio de aceite:
  Todos os subdominios tem uso explicito de LoggerService/DatabaseService em service/repository.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/modules/saude-zootecnia/medicamentos/medicamentos.service.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.ts
  src/modules/saude-zootecnia/dados-sanitarios/repositories/dados-sanitarios.repository.drizzle.ts
  src/modules/saude-zootecnia/dados-zootecnicos/repositories/dados-zootecnicos.repository.drizzle.ts
  src/modules/saude-zootecnia/medicamentos/repositories/medicamentos.repository.drizzle.ts
  src/modules/saude-zootecnia/vacinacao/repositories/vacinacao.repository.drizzle.ts
  src/core/database/database.service.ts
  src/core/logger/logger.service.ts

- Status:
  implementada

## SZO-CORE-003 - Core de paginacao e formatacao de data esta aplicado parcialmente no modulo

- Contexto de negocio:
  Historicos clinicos e zootecnicos precisam padrao de resposta para consumo uniforme.

- Regra principal:
  Dados sanitarios e zootecnicos usam PaginationDto/createPaginatedResponse/calculatePaginationParams e formatDateFields, enquanto medicamentos e vacinacao retornam listas sem paginacao explicita.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Integracao com utilitarios do Core existe em dois subdominios e e limitada nos demais.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/modules/saude-zootecnia/medicamentos/medicamentos.service.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.ts
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts
  src/core/utils/date-formatter.utils.ts

- Status:
  parcial

## SZO-CORE-004 - Helpers centrais de autorizacao por propriedade nao sao reutilizados

- Contexto de negocio:
  Em multi-tenant, autenticacao sozinha nao garante escopo de acesso por propriedade.

- Regra principal:
  Endpoints por propriedade deveriam reutilizar AuthHelperService e/ou PropertyExistsGuard para validar ownership antes de consultar dados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, modulo usa SupabaseAuthGuard mas nao usa helper central para ownership em leituras por propriedade.

- Criterio de aceite:
  Nao foram encontradas referencias a AuthHelperService/PropertyExistsGuard no modulo saude-zootecnia.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/
  src/core/services/auth-helper.service.ts
  src/core/guards/property-exists.guard.ts

- Status:
  parcial

## SZO-CORE-005 - Cache, decorators e validators compartilhados do Core nao sao aplicados no modulo

- Contexto de negocio:
  Reuso de artefatos compartilhados reduz divergencia de contrato e melhora desempenho em cenarios de leitura.

- Regra principal:
  No estado atual, nao ha uso de CacheInterceptor/CacheTTL, CacheService, decorator ToBoolean ou validators customizados de data do Core no modulo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao foram encontradas referencias a esses artefatos no codigo de saude-zootecnia.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/
  src/core/cache/cache.service.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts

- Status:
  parcial

## SZO-CORE-006 - UserHelper e utilitarios de similaridade do Core apoiam regras de dominio

- Contexto de negocio:
  Conversao de usuario autenticado e consolidacao semantica de termos clinicos sao regras transversais do dominio.

- Regra principal:
  Modulo deve usar UserHelper para resolver usuario interno e StringSimilarityUtil para agrupamento/normalizacao de doencas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  UnauthorizedException/erros internos quando usuario autenticado nao puder ser mapeado para usuario interno.

- Criterio de aceite:
  Dados sanitarios, dados-zootecnicos e vacinacao usam UserHelper; dados sanitarios usa StringSimilarityUtil/DoencaNormalizerUtil.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.ts
  src/modules/saude-zootecnia/dados-sanitarios/utils/doenca-normalizer.utils.ts
  src/core/utils/user.helper.ts
  src/core/utils/string-similarity.utils.ts

- Status:
  implementada

## SZO-TEST-001 - Nao ha cobertura automatizada dedicada para o modulo

- Contexto de negocio:
  Regras clinicas e de rastreabilidade merecem validacao automatizada para evitar regressao em producao.

- Regra principal:
  Modulo deveria ter testes dedicados para cada subdominio e para integracoes criticas (normalizacao de doenca, restore e ownership).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao foram encontradas suites .spec.ts/.e2e para saude-zootecnia no estado atual.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/
  test/

- Status:
  parcial
