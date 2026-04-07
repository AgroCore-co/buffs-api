# INFRA - Docker Compose Producao

## INFRA-PRD-001 - RabbitMQ de producao usa imagem enxuta sem management plugin

- Contexto de negocio:
  Producoes com recursos limitados precisam reduzir consumo de memoria e superficie de exposicao.

- Regra principal:
  RabbitMQ de producao deve usar imagem sem management UI e expor somente porta 5672.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Tentativa de acesso a management UI em producao nao funcionara por desenho.

- Criterio de aceite:
  compose de producao usa rabbitmq:3.13-alpine e remove publicacao da porta 15672.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-PRD-002 - API inicia apos dependencia saudavel de broker e ETL Worker

- Contexto de negocio:
  API depende de fila e ETL para fluxos assincronos e importacao/exportacao operacional.

- Regra principal:
  buffs-api deve depender de rabbitmq e buffs-etl-worker com condition service_healthy.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem dependencia por saude, API pode iniciar sem backend pronto e falhar em bootstrap/primeiras requisicoes.

- Criterio de aceite:
  compose de producao declara depends_on com condition service_healthy para os dois servicos.

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
  API em producao deve usar RABBITMQ_URL apontando para servico rabbitmq e ETL_BASE_URL apontando para buffs-etl-worker.

- Excecoes:
  IA_API_URL e resolvida via host.docker.internal para acesso a servico externo ao compose.

- Erros esperados:
  Uso de localhost para dependencia interna quebra comunicacao entre containers.

- Criterio de aceite:
  Variaveis de ambiente no servico buffs-api sobrescrevem URL de broker e ETL com hostnames internos.

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
