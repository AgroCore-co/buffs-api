# ALERTA - Criacao, Listagem e Idempotencia

## ALERTA-SVC-001 - Criacao persiste no banco e publica evento para mensageria

- Contexto de negocio:
  Alertas novos precisam entrar no banco imediatamente e disparar processamento assincrono de notificacao/classificacao.

- Regra principal:
  AlertasService.create deve inserir o alerta e emitir RabbitMQPatterns.ALERTA_CRIADO com payload do evento.

- Excecoes:
  Se RabbitMQ estiver indisponivel, o alerta continua salvo no banco e apenas o publish falha com warning.

- Erros esperados:
  500 quando a persistencia falha; sem erro bloqueante quando apenas a fila falha.

- Criterio de aceite:
  O service cria via AlertaRepositoryDrizzle e chama rmqClient.emit(...).subscribe(...).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/interfaces/alerta-criado-payload.interface.ts
  src/core/rabbitmq/rabbitmq.constants.ts

- Status:
  implementada

## ALERTA-SVC-002 - Duplicidade e controlada por chave de origem do evento

- Contexto de negocio:
  Jobs diarios podem reencontrar o mesmo evento varias vezes; sem chave de origem ocorreria inundacao de alertas repetidos.

- Regra principal:
  createIfNotExists deve buscar alertas existentes por tipo_evento_origem + id_evento_origem + nicho (+ animal quando informado).

- Excecoes:
  Se tipo_evento_origem/id_evento_origem nao vierem, o fluxo cai para criacao direta sem deduplicacao.

- Erros esperados:
  500 quando a busca de existentes falha.

- Criterio de aceite:
  O service chama alertaRepo.findExisting antes de criar um novo alerta.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts

- Status:
  implementada

## ALERTA-SVC-003 - Alerta nao visto bloqueia nova criacao da mesma origem

- Contexto de negocio:
  Enquanto o operador nao tratar o alerta, o sistema deve evitar duplicata do mesmo problema.

- Regra principal:
  Se houver alerta existente nao visto para a chave de origem, createIfNotExists retorna o registro existente e nao cria novo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  O ramo !existingAlert.visto retorna existingAlert sem chamar create.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts

- Status:
  implementada

## ALERTA-SVC-004 - Alertas recorrentes permitem novo ciclo apos visualizacao

- Contexto de negocio:
  Eventos cronicos (femea vazia/cobertura sem diagnostico) precisam reaparecer se a situacao persistir ao longo dos dias.

- Regra principal:
  Para FEMEA_VAZIA e COBERTURA_SEM_DIAGNOSTICO, quando o alerta anterior ja foi visto, o sistema pode criar novo alerta em outro dia.

- Excecoes:
  No mesmo dia, se ja existir recorrente nao visto para a mesma data, a criacao e bloqueada.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  O service consulta findRecorrenteSameDate com data_alerta e so cria novo quando nao houver alerta nao visto naquele dia.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts

- Status:
  implementada

## ALERTA-SVC-005 - Listagem global suporta filtros por nicho, janela de dias e visibilidade

- Contexto de negocio:
  Operacao precisa filtrar rapidamente alertas relevantes para resposta diaria.

- Regra principal:
  findAll aceita tipo, antecedencia e incluirVistos e retorna pagina padronizada.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  500 para falha de count/find no repositorio.

- Criterio de aceite:
  Service monta filtros com dataInicio/dataFim quando antecedencia for informada e usa createPaginatedResponse.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada

## ALERTA-SVC-006 - Listagem por propriedade suporta filtro por nichos e prioridade

- Contexto de negocio:
  Painel de propriedade precisa priorizar leitura por contexto local e gravidade.

- Regra principal:
  findByPropriedade deve filtrar por id_propriedade, status visto, nichos (array) e prioridade, com paginacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  500 para falhas de contagem/consulta.

- Criterio de aceite:
  Repository aplica idPropriedade obrigatorio, inArray para nichos e eq para prioridade.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts

- Status:
  implementada

## ALERTA-SVC-007 - Operacoes de atualizacao validam existencia antes de alterar estado

- Contexto de negocio:
  Evita updates silenciosos em IDs inexistentes e melhora consistencia de erro para o frontend.

- Regra principal:
  setVisto e atualizarPrioridade devem chamar findOne antes do update.

- Excecoes:
  Se o registro for removido entre findOne e update, o repositorio ainda retorna erro de nao encontrado.

- Erros esperados:
  404 para alerta inexistente; 500 para falhas de banco.

- Criterio de aceite:
  Ambos os metodos executam verificacao previa e tratam codigo PGRST116.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts

- Status:
  implementada

## ALERTA-SVC-008 - Remocao exige existencia previa e retorna sem payload

- Contexto de negocio:
  API de exclusao deve manter semantica HTTP 204 e evitar falso positivo de remocao.

- Regra principal:
  remove deve validar alerta existente e executar delete sem retorno de objeto.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  404 quando nao encontrado; 500 em falha de remocao.

- Criterio de aceite:
  Controller usa @HttpCode(204) e service retorna void apos alertaRepo.remove.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/repositories/alerta.repository.drizzle.ts

- Status:
  implementada

## ALERTA-SVC-009 - Classificacao automatica de prioridade e eventual, nao transacional

- Contexto de negocio:
  A API comunica classificacao por IA, mas a priorizacao depende de processamento assincrono na fila.

- Regra principal:
  Quando prioridade nao vem no create, o alerta pode ser criado sem prioridade e ser atualizado posteriormente pelo consumer.

- Excecoes:
  Se RabbitMQ ou consumer falharem, o alerta pode permanecer sem prioridade classificada.

- Erros esperados:
  Nao aplicavel (degradacao funcional sem erro bloqueante no create).

- Criterio de aceite:
  create persiste alerta antes do consumo IA e apenas registra warning em indisponibilidade de fila.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.service.ts
  src/modules/alerta/consumers/alertas.consumer.ts

- Status:
  parcial
