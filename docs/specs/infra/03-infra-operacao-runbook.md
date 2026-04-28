# INFRA - Operacao e Runbook

## INFRA-OPS-001 - Runbook local padroniza ciclo de vida da stack

- Contexto de negocio:
  Time precisa comandos consistentes para subir, observar e desligar ambiente sem erro operacional.

- Regra principal:
  README de infra deve padronizar comandos de up, logs, down, down -v e ps usando compose local.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Uso de comandos inconsistentes gera diagnostico mais lento e variacao de ambiente entre devs.

- Criterio de aceite:
  README de infra documenta os comandos base de gerenciamento geral com exemplos prontos.

- Rastreabilidade para codigo e testes:
  infra/README.md
  infra/docker-compose.yml

- Status:
  implementada

## INFRA-OPS-002 - Operacao de RabbitMQ possui comandos especificos para inspecao e reset

- Contexto de negocio:
  Incidentes de fila exigem capacidade de inspecionar queues/exchanges e executar reset controlado.

- Regra principal:
  Runbook deve incluir comandos docker exec para listagem de queues, exchanges, bindings e reset do broker.

- Excecoes:
  Reset remove estado operacional e deve ser usado somente em diagnostico controlado.

- Erros esperados:
  Reset indevido apaga filas e mensagens, impactando processamento assincrono.

- Criterio de aceite:
  README inclui comandos rabbitmqctl de inspecao e fluxo de reset com alerta de impacto.

- Rastreabilidade para codigo e testes:
  infra/README.md

- Status:
  implementada

## INFRA-OPS-003 - Troubleshooting cobre conectividade de broker e conflito de portas

- Contexto de negocio:
  Falhas mais comuns de desenvolvimento estao relacionadas a container parado, erro de conexao e porta em uso.

- Regra principal:
  README deve orientar verificacao de container, leitura de logs, teste de endpoint e diagnostico de porta.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem runbook de troubleshooting, tempo medio de resolucao aumenta em incidentes de setup.

- Criterio de aceite:
  README documenta passos com docker ps, logs e lsof para os cenarios principais.

- Rastreabilidade para codigo e testes:
  infra/README.md

- Status:
  implementada

## INFRA-OPS-004 - Comando de bootstrap de producao esta documentado para EC2

- Contexto de negocio:
  Deploy operacional em EC2 precisa comando deterministico para build e subida da stack.

- Regra principal:
  O compose de producao deve documentar no cabecalho o path e o comando de subida recomendado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem instrucao explicita, operadores podem executar compose errado ou no path incorreto.

- Criterio de aceite:
  Cabecalho do compose de producao inclui cd para raiz e comando up -d --build.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-OPS-006 - Buffs IA e gerenciado exclusivamente via Docker em producao

- Contexto de negocio:
  A IA passou a rodar no compose de producao e nao deve concorrer com processos no host.

- Regra principal:
  Antes do deploy, o processo do PM2 para buffs-ia deve ser interrompido e removido.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Manter buffs-ia no PM2 causa conflito de porta e inconsistencias de runtime.

- Criterio de aceite:
  Runbook inclui comandos para stop/delete do processo no PM2 e persistencia com pm2 save.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-OPS-005 - Operacao da infraestrutura ainda depende de execucao manual de comandos

- Contexto de negocio:
  Processos manuais aumentam risco de erro humano em tarefas recorrentes de setup e manutencao.

- Regra principal:
  Infraestrutura deveria evoluir para scripts automatizados (ex.: make, task runner ou CI jobs) para padronizar operacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Divergencia de procedimentos entre operadores e ambientes.

- Criterio de aceite:
  No estado atual, operacao e orientada por comandos manuais no README, sem scripts dedicados no repositorio.

- Rastreabilidade para codigo e testes:
  infra/README.md
  infra/docker-compose.yml
  infra/docker-compose.prod.yml

- Status:
  parcial
