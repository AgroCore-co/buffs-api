# INFRA - Visao Geral

## INFRA-ARCH-001 - Repositorio de infraestrutura organiza ambientes local e producao por compose dedicado

- Contexto de negocio:
  O projeto precisa de padroes claros para subir dependencias em desenvolvimento e executar stack enxuta em producao.

- Regra principal:
  A infraestrutura deve ser descrita por dois manifests: compose local e compose de producao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Uso de arquivo incorreto para o ambiente pode expor portas desnecessarias ou omitir servicos essenciais.

- Criterio de aceite:
  Existem arquivos separados para local e producao com objetivos distintos e comentarios de uso.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-ARCH-002 - RabbitMQ e dependencia obrigatoria para processamento assincrono

- Contexto de negocio:
  Fluxos assincronos de alerta dependem de broker para entrega e resiliencia.

- Regra principal:
  Ambos os ambientes devem disponibilizar RabbitMQ com healthcheck e volume persistente.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem RabbitMQ saudavel, consumidores nao iniciam corretamente e eventos ficam indisponiveis.

- Criterio de aceite:
  Os dois manifests definem servico rabbitmq com healthcheck, volume e credenciais base.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/docker-compose.prod.yml
  src/main.ts

- Status:
  implementada

## INFRA-ARCH-003 - Producao usa topologia minima com API, broker e ETL Worker

- Contexto de negocio:
  A operacao em producao precisa somente dos componentes criticos para processar API, fila e planilhas.

- Regra principal:
  O compose de producao deve orquestrar rabbitmq, buffs-api e buffs-etl-worker em rede interna compartilhada.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de dependencia entre servicos quando ordem de inicializacao nao respeitar saude dos componentes.

- Criterio de aceite:
  buffs-api depende de rabbitmq e buffs-etl-worker com condition service_healthy.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-ARCH-004 - Ambiente local prioriza bootstrap rapido com servicos opcionais comentados

- Contexto de negocio:
  Desenvolvimento diario deve iniciar rapido, mantendo servicos adicionais disponiveis quando necessario.

- Regra principal:
  O compose local deve manter RabbitMQ ativo e Postgres/Redis/ETL como blocos opcionais comentados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem ativacao de blocos opcionais, fluxos dependentes desses servicos nao funcionam localmente.

- Criterio de aceite:
  Apenas rabbitmq esta ativo por padrao e os demais servicos aparecem comentados com instrucoes.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/README.md

- Status:
  implementada

## INFRA-ARCH-005 - Nao ha validacao automatizada dedicada para manifests de infraestrutura

- Contexto de negocio:
  Mudancas em compose podem quebrar operacao sem deteccao antecipada quando nao ha validacao automatica.

- Regra principal:
  Infraestrutura deveria ter validacoes automatizadas de compose lint/boot check em pipeline.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erros de configuracao podem aparecer somente no deploy/execucao manual.

- Criterio de aceite:
  No estado atual, nao existem suites automatizadas dedicadas para validar manifests de infra no repositorio.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/docker-compose.prod.yml
  infra/README.md

- Status:
  parcial
