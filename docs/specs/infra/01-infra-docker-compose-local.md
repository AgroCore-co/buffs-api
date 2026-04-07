# INFRA - Docker Compose Local

## INFRA-LOC-001 - RabbitMQ local exposto para AMQP e management UI

- Contexto de negocio:
  Time de desenvolvimento precisa inspecionar filas e diagnosticar mensageria em ambiente local.

- Regra principal:
  O compose local deve publicar portas 5672 (AMQP) e 15672 (management UI) no host.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Conflito de porta local impede subida do broker.

- Criterio de aceite:
  Servico rabbitmq no compose local declara ambas as portas e imagem com plugin management.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/README.md

- Status:
  implementada

## INFRA-LOC-002 - Estado e logs do broker persistem em volumes locais

- Contexto de negocio:
  Persistencia facilita continuidade de debug e evita perda total de estado a cada restart.

- Regra principal:
  O broker local deve montar volume para dados e volume para logs.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem volumes, reinicios podem remover historico operacional e contexto de fila.

- Criterio de aceite:
  compose local define rabbitmq_data e rabbitmq_logs conectados ao servico rabbitmq.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml

- Status:
  implementada

## INFRA-LOC-003 - Confiabilidade local usa restart policy e healthcheck

- Contexto de negocio:
  Ambiente de desenvolvimento precisa recuperar rapido em falhas ocasionais do container.

- Regra principal:
  O servico rabbitmq deve usar restart unless-stopped e healthcheck rabbitmq-diagnostics ping.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem healthcheck, dependencias podem iniciar antes do broker estar apto.

- Criterio de aceite:
  compose local declara restart e healthcheck com interval/retries/start_period.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml

- Status:
  implementada

## INFRA-LOC-004 - ETL Worker, Postgres e Redis permanecem opcionais por bloco comentado

- Contexto de negocio:
  Nem todo fluxo de desenvolvimento requer stack completa ligada permanentemente.

- Regra principal:
  O compose local deve fornecer templates comentados para ETL Worker, Postgres e Redis com instrucoes de ativacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Dependencias opcionais nao estarao disponiveis ate serem descomentadas.

- Criterio de aceite:
  Arquivo exibe blocos comentados com portas, volumes e notas de uso para cada servico opcional.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/README.md

- Status:
  implementada

## INFRA-LOC-005 - Credenciais padrao do broker sao de desenvolvimento e nao devem ir para producao

- Contexto de negocio:
  Uso de credenciais default fora do ambiente local aumenta risco de acesso indevido.

- Regra principal:
  Credenciais admin/admin devem permanecer restritas ao ambiente local.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Exposicao de credenciais fracas em ambiente externo compromete seguranca do broker.

- Criterio de aceite:
  README de infra alerta explicitamente para nao usar credenciais padrao em producao.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/README.md

- Status:
  implementada
