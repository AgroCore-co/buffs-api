# ALERTA - Consumer e Classificacao por IA

## ALERTA-CNS-001 - Consumer assina evento ALERTA_CRIADO da infraestrutura RabbitMQ

- Contexto de negocio:
  Alertas criados precisam de processamento assincrono para classificacao e observabilidade sem bloquear API.

- Regra principal:
  AlertasConsumer deve escutar RabbitMQPatterns.ALERTA_CRIADO via @EventPattern em modulo de consumer dedicado, inicializado em contexto isolado de microservico.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem subscriber ativo, eventos publicados nao sao processados.

- Criterio de aceite:
  O metodo handleAlertaCriado recebe payload + RmqContext, e o consumer e registrado no AlertsConsumerModule, importado por AppConsumerModule e inicializado via NestFactory.createMicroservice no bootstrap.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/consumers/alertas.consumer.ts
  src/modules/alerta/consumers/alerts-consumer.module.ts
  src/app.consumer.module.ts
  src/main.ts
  src/core/rabbitmq/rabbitmq.constants.ts

- Status:
  implementada

## ALERTA-CNS-002 - Acknowledgement e manual para garantir confiabilidade

- Contexto de negocio:
  O pipeline precisa controle explicito de sucesso/falha para evitar perda silenciosa ou loop infinito.

- Regra principal:
  Em sucesso o consumer executa ack; em falha executa nack sem requeue.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Mensagens com erro permanente seguem para DLX/DLQ quando configurado no broker.

- Criterio de aceite:
  handleAlertaCriado chama channel.ack(originalMsg) no try e channel.nack(originalMsg, false, false) no catch.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/consumers/alertas.consumer.ts

- Status:
  implementada

## ALERTA-CNS-003 - Classificacao IA ocorre apenas quando prioridade nao vem definida

- Contexto de negocio:
  Alertas com prioridade manual nao devem ser sobrescritos automaticamente.

- Regra principal:
  classificarComIA deve ser chamado somente quando payload.prioridade for nulo/ausente.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  O handler verifica if (!data.prioridade) antes de chamar classificacao.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/consumers/alertas.consumer.ts

- Status:
  implementada

## ALERTA-CNS-004 - Texto enviado ao Gemini usa fallback para manter classificacao em payload incompleto

- Contexto de negocio:
  Nem todo produtor envia texto clinico detalhado; e preciso degradar para descricao/titulo quando necessario.

- Regra principal:
  O texto de classificacao deve priorizar texto_ocorrencia_clinica e cair para descricao, titulo ou mensagem padrao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  classificarComIA monta texto por coalescencia (texto_ocorrencia_clinica ?? descricao ?? titulo ?? fallback).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/consumers/alertas.consumer.ts
  src/modules/alerta/interfaces/alerta-criado-payload.interface.ts

- Status:
  implementada

## ALERTA-CNS-005 - Chamada para Gemini tem timeout de 10 segundos

- Contexto de negocio:
  A fila nao pode ficar bloqueada indefinidamente por lentidao externa de IA.

- Regra principal:
  Classificacao deve competir com timeout de 10s via Promise.race.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Em timeout, mensagem e nacked para fluxo de falha do broker.

- Criterio de aceite:
  Constante GEMINI_TIMEOUT_MS = 10000 e Promise.race entre classificarPrioridadeOcorrencia e timeoutPromise.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/consumers/alertas.consumer.ts
  src/core/gemini/gemini.service.ts

- Status:
  implementada

## ALERTA-CNS-006 - Resultado da IA atualiza prioridade no registro persistido

- Contexto de negocio:
  A prioridade classificada precisa refletir na listagem e ordenacao de alertas no painel.

- Regra principal:
  O consumer deve chamar AlertasService.atualizarPrioridade apos receber classificacao do Gemini.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  404/500 da atualizacao levam ao fluxo de falha do consumer (nack).

- Criterio de aceite:
  classificarComIA chama this.alertasService.atualizarPrioridade(data.id_alerta, prioridade).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/consumers/alertas.consumer.ts
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts

- Status:
  implementada

## ALERTA-CNS-007 - Classificacao automatica depende de saude da mensageria e do consumer

- Contexto de negocio:
  O create HTTP responde antes do processamento assincrono; falha de fila impacta completude da prioridade.

- Regra principal:
  Quando RabbitMQ estiver indisponivel, o sistema persiste o alerta e registra warning sem interromper create.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Alertas podem permanecer com prioridade nula se evento nao for consumido.

- Criterio de aceite:
  O produtor encapsula emit em try/catch com warn e nao executa fallback sincrono de classificacao.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/consumers/alertas.consumer.ts

- Status:
  parcial
