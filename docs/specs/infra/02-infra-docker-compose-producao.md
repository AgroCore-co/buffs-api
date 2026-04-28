# INFRA - Docker Compose Producao

## INFRA-PRD-001 - RabbitMQ de producao usa imagem enxuta sem management plugin

- Contexto de negocio:
  Producoes com recursos limitados precisam reduzir consumo de memoria e superficie de exposicao.

- Regra principal:
  RabbitMQ de producao deve usar imagem sem management UI e expor somente porta 5672 na rede interna.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Tentativa de acesso a management UI em producao nao funcionara por desenho.

- Criterio de aceite:
  compose de producao usa rabbitmq:3.13-alpine e nao publica porta 15672 no host.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-PRD-008 - ETL Worker recebe chave interna e URL direta do banco

- Contexto de negocio:
  ETL precisa autenticar chamadas internas e usar pgx COPY no banco sem pooler.

- Regra principal:
  Compose de producao deve injetar BUFFS_ETL_INTERNAL_KEY e BUFFS_ETL_DB_URL no serviço buffs-etl-worker.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem chave interna, requisoes inter-servico falham; sem URL direta, bulk insert pode falhar.

- Criterio de aceite:
  buffs-etl-worker recebe BUFFS_ETL_INTERNAL_KEY via ETL_INTERNAL_KEY e BUFFS_ETL_DB_URL via .env.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml
  internal/config/config.go

- Status:
  implementada

## INFRA-PRD-009 - IA roda no compose com treino no build e volume de modelos

- Contexto de negocio:
  A IA deve rodar internamente e persistir modelos treinados sem depender de processo externo.

- Regra principal:
  buffs-ia deve ser buildado em multi-stage, executar treino no build e persistir modelos via volume.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem treino no build ou volume, o modelo pode ficar ausente apos restart.

- Criterio de aceite:
  compose de producao define buffs-ia com build args, healthcheck em GET / e volume ia_models.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml
  ../../buffs-ia/Dockerfile
  ../../buffs-ia/treinar_ia.py

- Status:
  implementada

## INFRA-PRD-010 - CORS da API e configurado via variavel de ambiente

- Contexto de negocio:
  API precisa aceitar frontend LAN e WAN sem alterar codigo em deploys.

- Regra principal:
  Compose de producao deve passar CORS_ORIGIN do .env para o container da API.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem CORS_ORIGIN, chamadas do frontend podem ser bloqueadas.

- Criterio de aceite:
  buffs-api recebe CORS_ORIGIN via environment e o bootstrap le a variavel.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml
  src/main.ts

- Status:
  implementada

## INFRA-PRD-002 - API inicia apos dependencia saudavel de broker, ETL Worker e IA

- Contexto de negocio:
  API depende de fila, ETL e IA para fluxos assincronos, ingestao e simulacoes.

- Regra principal:
  buffs-api deve depender de rabbitmq, buffs-etl-worker e buffs-ia com condition service_healthy.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem dependencia por saude, API pode iniciar sem backend pronto e falhar em bootstrap/primeiras requisicoes.

- Criterio de aceite:
  compose de producao declara depends_on com condition service_healthy para os tres servicos.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-PRD-003 - Uploads temporarios sao compartilhados entre API e ETL Worker

- Contexto de negocio:
  Fluxo de ingestao de planilhas requer que API e worker acessem os mesmos arquivos temporarios.

- Regra principal:
  buffs-api e buffs-etl-worker devem montar o mesmo bind mount de temp/uploads.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem volume compartilhado, worker nao encontra arquivos enviados pela API.

- Criterio de aceite:
  Os dois servicos montam ../temp/uploads com destino interno consistente.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-PRD-004 - Endpoints internos de dependencia sao resolvidos por DNS da rede Docker

- Contexto de negocio:
  Comunicacao entre containers precisa usar hostnames de servico internos para estabilidade de deploy.

- Regra principal:
  API em producao deve usar RABBITMQ_URL, ETL_BASE_URL e IA_API_URL apontando para hostnames internos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Uso de localhost para dependencia interna quebra comunicacao entre containers.

- Criterio de aceite:
  Variaveis de ambiente no servico buffs-api sobrescrevem broker, ETL e IA com hostnames internos.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-PRD-005 - Limites de memoria e heap sao definidos para conter consumo em EC2

- Contexto de negocio:
  Instancias pequenas exigem controle de consumo para evitar OOM e degradacao da stack.

- Regra principal:
  Producao deve aplicar limites de memoria para rabbitmq e buffs-api, alem de heap maximo do Node na API.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem controles, picos podem causar instabilidade por exaustao de memoria.

- Criterio de aceite:
  compose de producao define limits de memoria e NODE_OPTIONS com max-old-space-size para buffs-api.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-PRD-006 - Bloco deploy.resources pode nao ser aplicado em modo compose tradicional

- Contexto de negocio:
  Configuracoes de limite devem ser efetivamente aplicadas no ambiente alvo para cumprir o objetivo operacional.

- Regra principal:
  Quando executado fora de orchestrator compativel com deploy, limites declarados podem nao surtir efeito.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Operacao pode assumir limites ativos quando na pratica o runtime ignora parte da configuracao.

- Criterio de aceite:
  compose de producao usa bloco deploy.resources em servicos, o que requer validacao no runtime alvo para garantir aplicacao real.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  parcial

## INFRA-PRD-007 - API de producao nao possui healthcheck proprio no manifesto

- Contexto de negocio:
  Healthcheck do servico principal facilita automacao de restart e diagnosico de disponibilidade.

- Regra principal:
  buffs-api deveria expor healthcheck no compose de producao para monitoramento de liveness/readiness.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem healthcheck da API no manifesto, deteccao de falhas depende de monitoramento externo.

- Criterio de aceite:
  No estado atual, buffs-api nao possui secao healthcheck no compose de producao.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml
  src/health/health.controller.ts

- Status:
  parcial
