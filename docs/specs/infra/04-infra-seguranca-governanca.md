# INFRA - Seguranca e Governanca

## INFRA-SEC-001 - Credenciais padrao sao explicitamente restritas ao ambiente local

- Contexto de negocio:
  Seguranca operacional exige separar credenciais de desenvolvimento e producao.

- Regra principal:
  Documentacao deve deixar explicito que credenciais default nao podem ser usadas em producao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Reuso de credenciais fracas em ambiente externo pode permitir acesso nao autorizado.

- Criterio de aceite:
  README de infra contem alerta de seguranca e exemplos de credenciais apenas para desenvolvimento local.

- Rastreabilidade para codigo e testes:
  infra/README.md
  infra/docker-compose.yml

- Status:
  implementada

## INFRA-SEC-002 - Segmentacao de rede separa ambiente local e producao

- Contexto de negocio:
  Isolamento de rede reduz acoplamento entre stacks e melhora previsibilidade de resolucao de servico.

- Regra principal:
  Cada compose deve declarar bridge network nomeada para seu ambiente.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem redes nomeadas, pode haver conflito com stacks paralelas no mesmo host.

- Criterio de aceite:
  Compose local usa nome de rede proprio e compose de producao usa nome distinto.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-SEC-003 - Producao minimiza exposicao externa de portas de infraestrutura

- Contexto de negocio:
  Reduzir superficies externas de administracao diminui risco de acesso indevido.

- Regra principal:
  Compose de producao deve manter apenas portas necessarias publicadas e evitar UI administrativa do broker.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Exposicao de portas administrativas facilita tentativa de acesso nao autorizado.

- Criterio de aceite:
  Em producao, rabbitmq publica somente 5672 e nao publica 15672.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-SEC-004 - Integracao com servico de IA no host exige controle de fronteira de rede

- Contexto de negocio:
  API em container acessa IA hospedada no host por host-gateway, criando fronteira adicional de confianca.

- Regra principal:
  Compose de producao deve mapear host.docker.internal para host-gateway para conexao com IA externa ao compose.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem mapeamento, API nao alcanca endpoint de IA no host.

- Criterio de aceite:
  buffs-api define IA_API_URL com host.docker.internal e extra_hosts com host-gateway.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.prod.yml

- Status:
  implementada

## INFRA-SEC-005 - Gestao de secrets em producao ainda depende de variaveis em arquivo de ambiente

- Contexto de negocio:
  Segredos operacionais devem seguir politica de armazenamento seguro e rotacao controlada.

- Regra principal:
  Producao deveria preferir mecanismo dedicado de segredo (ex.: secret manager do orquestrador) em vez de dependencia exclusiva de .env.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Exposicao acidental de arquivo de ambiente compromete credenciais de infraestrutura.

- Criterio de aceite:
  README recomenda secrets manager para producao, enquanto manifests ainda dependem de env_file para bootstrap.

- Rastreabilidade para codigo e testes:
  infra/README.md
  infra/docker-compose.prod.yml

- Status:
  parcial

## INFRA-TEST-001 - Nao ha cobertura automatizada dedicada para seguranca e compliance de manifests

- Contexto de negocio:
  Regras de hardening e compliance de compose precisam verificacao continua para evitar drift.

- Regra principal:
  Repositorio deveria ter checks automatizados de policy/lint para manifests de infraestrutura.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Configuracoes inseguras podem entrar em revisao sem deteccao automatica.

- Criterio de aceite:
  No estado atual, nao foram encontradas validacoes automatizadas especificas para policy de infra.

- Rastreabilidade para codigo e testes:
  infra/docker-compose.yml
  infra/docker-compose.prod.yml
  infra/README.md

- Status:
  parcial
