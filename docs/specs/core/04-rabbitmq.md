# CORE - RabbitMQ

## CORE-RMQ-001 - Contrato central de filas e eventos

- Contexto de negocio:
  Publicadores e consumidores precisam compartilhar nomes de fila e pattern sem divergencia.

- Regra principal:
  Nomes de queue, DLQ, exchange e patterns devem ficar centralizados em constantes do Core.

- Excecoes:
  Sem excecoes no estado atual.

- Erros esperados:
  Mensagens nao consumidas quando pattern divergir entre produtor e consumidor.

- Criterio de aceite:
  Modulos de alerta publicam e consomem via constantes compartilhadas.

- Rastreabilidade para codigo e testes:
  src/core/rabbitmq/rabbitmq.constants.ts
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/consumers/alertas.consumer.ts

- Status:
  implementada

## CORE-RMQ-002 - Queue principal duravel com DLX

- Contexto de negocio:
  Eventos de alerta nao podem ser perdidos por falha temporaria de consumidor.

- Regra principal:
  Queue buffs.alerts deve ser duravel e configurada com dead-letter exchange.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Mensagens com falha definitiva devem ser roteadas para DLQ.

- Criterio de aceite:
  Configuracao do client RMQ define durable true e x-dead-letter-exchange.

- Rastreabilidade para codigo e testes:
  src/core/rabbitmq/rabbitmq.module.ts

- Status:
  implementada

## CORE-RMQ-003 - Bootstrap de DLX/DLQ com retry

- Contexto de negocio:
  Ambiente pode subir com race condition entre API e broker.

- Regra principal:
  Startup deve tentar criar DLX/DLQ com retries limitados e logar degradacao se falhar.

- Excecoes:
  Em falha final de bootstrap, app continua mas registra risco operacional.

- Erros esperados:
  Warn/error de configuracao de fila em bootstrap.

- Criterio de aceite:
  Processo tenta ate 3 vezes criar exchange, queue e bind.

- Rastreabilidade para codigo e testes:
  src/core/rabbitmq/rabbitmq-bootstrap.service.ts

- Status:
  implementada

## CORE-RMQ-004 - Consumo com ack manual e prefetch controlado

- Contexto de negocio:
  Fluxo de alerta com IA exige controle explicito de confirmacao de mensagem.

- Regra principal:
  Consumo deve operar com noAck false, prefetchCount 1 e nack sem requeue em falha permanente.

- Excecoes:
  Nao aplicavel para outros consumidores que adotem estrategia distinta por design.

- Erros esperados:
  Mensagem vai para DLQ quando processamento falha.

- Criterio de aceite:
  Bootstrap da app e consumer executam contrato de ack/nack manual.

- Rastreabilidade para codigo e testes:
  src/main.ts
  src/modules/alerta/consumers/alertas.consumer.ts

- Status:
  implementada
