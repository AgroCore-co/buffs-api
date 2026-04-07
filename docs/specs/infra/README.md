# INFRA - Indice de Especificacoes

Este diretorio contem as regras do repositorio de infraestrutura.

Documentos:

- 00-infra-visao-geral.md
- 01-infra-docker-compose-local.md
- 02-infra-docker-compose-producao.md
- 03-infra-operacao-runbook.md
- 04-infra-seguranca-governanca.md
- 05-infra-redis-cache-padrao.md

Escopo coberto:

- Arquitetura da infraestrutura local e de producao via Docker Compose.
- Contratos operacionais de RabbitMQ, API e ETL Worker.
- Regras de rede, volumes persistentes e compartilhamento de uploads.
- Runbook de operacao e troubleshooting para ambiente local.
- Regras de seguranca, credenciais e pontos de melhoria para hardening.
- Plano de migracao para Redis como cache padrao, com impacto em modulos da API.
