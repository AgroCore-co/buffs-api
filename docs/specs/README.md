# SDD - BUFFS API

Este diretorio centraliza o Software Design Document (SDD) do projeto.

Objetivos:

- Registrar regras de negocio de forma explicita e rastreavel.
- Reduzir dependencia de conhecimento tacito do codigo.
- Facilitar onboarding, revisao tecnica e evolucao segura.

## Estrutura Atual

- core/: Especificacoes do modulo Core.
- auth/: Especificacoes do modulo de autenticacao e autorizacao.
- dashboard/: Especificacoes do modulo de metricas e indicadores.
- alimentacao/: Especificacoes do modulo de definicoes e registros de alimentacao.
- usuario/: Especificacoes do modulo de usuarios, funcionarios e vinculos com propriedades.
- gestao-propriedade/: Especificacoes do modulo de propriedades, enderecos e lotes.
- rebanho/: Especificacoes do modulo de bufalos, grupos, racas e movimentacao entre lotes.
- saude-zootecnia/: Especificacoes do modulo clinico e zootecnico (sanitario, zootecnico, medicacoes e vacinacao).
- reproducao/: Especificacoes do modulo de cobertura, genealogia, material genetico e simulacao de acasalamento.
- producao/: Especificacoes do modulo de lactacao, ordenha, estoque diario, retiradas, laticinios e predicao de producao.
- alerta/: Especificacoes do modulo de alertas (scheduler, verificacoes por nicho, idempotencia e classificacao por IA).
- sync/: Especificacoes do modulo de sincronizacao offline-first para consumo mobile por propriedade.
- data-ingestion/: Especificacoes do modulo de importacao/exportacao de planilhas e integracao com ETL.
- infra/: Especificacoes do repositorio de infraestrutura (docker compose local/producao, operacao e seguranca).

## Padrao de Regra (obrigatorio)

Toda regra deve seguir este formato:

1. ID da regra
2. Contexto de negocio
3. Regra principal
4. Excecoes
5. Erros esperados
6. Criterio de aceite
7. Rastreabilidade para codigo e testes
8. Status (implementada, parcial, pendente)

Use o arquivo TEMPLATE-RULE.md como base para novos documentos.

## Convencoes

- IDs por dominio: CORE-*, AUTH-*, REBANHO-*, REPRO-*, etc.
- Linguagem orientada a regra e comportamento observavel.
- Evitar descrever implementacao sem declarar regra de negocio.
- Sempre incluir rastreabilidade minima para arquivo de codigo.

## Proximo passo sugerido

Depois de CORE/Auth/Dashboard/Alimentacao/Usuario/Gestao-Propriedade/Rebanho/Saude-Zootecnia/Reproducao/Producao/Alerta/Data-Ingestion/Infra, seguir com consolidacao transversal:

- Revisao e priorizacao dos itens com Status parcial nos modulos documentados
