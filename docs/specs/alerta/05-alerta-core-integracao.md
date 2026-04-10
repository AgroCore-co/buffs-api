# ALERTA - Integracao com Core

## ALERTA-CORE-001 - Modulo integra infraestrutura compartilhada via modulo de providers

- Contexto de negocio:
  O dominio de alertas depende de acesso transacional ao banco, publicacao de eventos e classificacao por IA.

- Regra principal:
  AlertasProvidersModule deve importar DatabaseModule, RabbitMQModule e GeminiModule, sendo reutilizado pelo modulo HTTP e pelo modulo de consumer.

- Excecoes:
  ConfigModule tambem e importado no providers module para parametros de ambiente.

- Erros esperados:
  Falha de DI quando modulo de infraestrutura nao estiver registrado.

- Criterio de aceite:
  AlertasProvidersModule importa CoreModule, GeminiModule, DatabaseModule, RabbitMQModule e ConfigModule; AlertasModule e AlertsConsumerModule importam AlertasProvidersModule.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.providers.module.ts
  src/modules/alerta/alerta.module.ts
  src/modules/alerta/consumers/alerts-consumer.module.ts

- Status:
  implementada

## ALERTA-CORE-002 - Persistencia usa padrao Drizzle via DatabaseService

- Contexto de negocio:
  Consistencia de query evita divergencia de comportamento entre servicos de nicho.

- Regra principal:
  Repositorios do modulo devem injetar DatabaseService e consultar schema via drizzle.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falhas de query propagam erro para services e resposta 500.

- Criterio de aceite:
  Repositories usam this.databaseService.db com operadores eq/and/asc/desc/gte/lte.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/repositories/alerta.repository.drizzle.ts
  src/modules/alerta/repositories/bufalo.repository.drizzle.ts
  src/modules/alerta/repositories/reproducao.repository.drizzle.ts
  src/modules/alerta/repositories/sanitario.repository.drizzle.ts
  src/modules/alerta/repositories/producao.repository.drizzle.ts
  src/core/database/database.service.ts

- Status:
  implementada

## ALERTA-CORE-003 - Scheduler consulta propriedades ativas direto na camada de banco compartilhada

- Contexto de negocio:
  O orquestrador precisa descobrir tenants validos antes de executar regra por propriedade.

- Regra principal:
  Scheduler deve usar DatabaseService para listar propriedades sem deletedAt.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Em falha de consulta, retorna lista vazia e os jobs nao criam alertas.

- Criterio de aceite:
  getPropriedadesAtivas executa query.propriedade.findMany com where isNull(propriedade.deletedAt).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.scheduler.ts
  src/core/database/database.service.ts
  src/database/schema.ts

- Status:
  implementada

## ALERTA-CORE-004 - Contrato de mensageria do Core e reutilizado para evento de alerta criado

- Contexto de negocio:
  Producer e consumer precisam de pattern unico para evitar desacoplamento quebrado.

- Regra principal:
  O producer deve usar token RABBITMQ_SERVICE e pattern RabbitMQPatterns.ALERTA_CRIADO.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Indisponibilidade de broker gera warning e degrade assicrono de classificacao.

- Criterio de aceite:
  AlertasService injeta @Inject(RABBITMQ_SERVICE) ClientProxy e chama emit com RabbitMQPatterns.ALERTA_CRIADO.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/core/rabbitmq/rabbitmq.constants.ts
  src/core/rabbitmq/rabbitmq.module.ts

- Status:
  implementada

## ALERTA-CORE-005 - GeminiService do Core classifica prioridade no consumidor de fila

- Contexto de negocio:
  Priorizacao automatica reduz tempo de triagem humana em cenarios com muitos alertas.

- Regra principal:
  Consumer deve chamar geminiService.classificarPrioridadeOcorrencia e persistir retorno.

- Excecoes:
  Timeout/falha de IA aciona nack e envio para fluxo de falha do broker.

- Erros esperados:
  Alertas podem ficar sem prioridade enquanto nao houver reprocessamento.

- Criterio de aceite:
  AlertasConsumer injeta GeminiService e chama AlertasService.atualizarPrioridade apos classificacao.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/consumers/alertas.consumer.ts
  src/core/gemini/gemini.service.ts
  src/modules/alerta/alerta.service.ts

- Status:
  implementada

## ALERTA-CORE-006 - Endpoints GET aplicam cache compartilhado do Nest Core stack

- Contexto de negocio:
  Listagens de dashboard sao consultas repetidas e se beneficiam de cache curto.

- Regra principal:
  GET /alertas, GET /alertas/propriedade/:id_propriedade e GET /alertas/:id devem usar CacheInterceptor com TTL 30s.

- Excecoes:
  Endpoints mutantes (POST/PATCH/DELETE) nao usam cache.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Controller aplica @UseInterceptors(CacheInterceptor) e @CacheTTL(30) nos tres GETs.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts

- Status:
  implementada

## ALERTA-CORE-007 - Contrato de paginacao e utilitarios de data do Core sao reutilizados nas listagens

- Contexto de negocio:
  Uniformidade de resposta paginada facilita consumo por frontend e padroniza metadados.

- Regra principal:
  findAll e findByPropriedade devem usar PaginationDto, calculatePaginationParams e createPaginatedResponse.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Service calcula limit/offset com utilitario do Core e formata datas com formatDateFieldsArray.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts
  src/core/utils/date-formatter.utils.ts

- Status:
  implementada

## ALERTA-CORE-008 - Tratamento de erro reaproveita helpers compartilhados

- Contexto de negocio:
  Erros estruturados facilitam observabilidade em scheduler e camada de criacao.

- Regra principal:
  Falhas devem usar getErrorMessage/getErrorStack para logs e mensagens padronizadas.

- Excecoes:
  Alguns fluxos ainda usam console.error direto.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Scheduler usa getErrorMessage/getErrorStack; AlertasService usa getErrorMessage em varios pontos.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.scheduler.ts
  src/modules/alerta/alerta.service.ts
  src/core/utils/error.utils.ts

- Status:
  implementada

## ALERTA-CORE-009 - Logging nao usa LoggerService compartilhado do Core

- Contexto de negocio:
  Padrao unico de logging facilitaria correlacao entre modulos.

- Regra principal:
  Modulo deveria centralizar logs no LoggerService do Core.

- Excecoes:
  Implementacao atual usa Logger nativo do Nest em controller/service/scheduler/consumers.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Classes do modulo importam Logger de @nestjs/common e nao injetam LoggerService do Core.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/alerta.scheduler.ts
  src/modules/alerta/consumers/alertas.consumer.ts
  src/core/logger/logger.service.ts

- Status:
  parcial

## ALERTA-CORE-010 - Validacao de ownership por propriedade reaproveita AuthHelperService

- Contexto de negocio:
  Guard de autenticacao valida identidade, mas nao ownership explicito por tenant.

- Regra principal:
  Endpoints com id_propriedade devem chamar helper central para validar vinculo do usuario a propriedade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  404 quando o usuario autenticado nao possui vinculo com a propriedade solicitada.

- Criterio de aceite:
  AlertasController injeta AuthHelperService e valida ownership nos fluxos findByPropriedade/verificarAlertas antes de delegar aos servicos.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada
