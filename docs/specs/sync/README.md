# SYNC - Indice de Especificacoes

Este diretorio contem as regras do modulo de sincronizacao offline-first.

Documentos:
- 00-sync-visao-geral.md
- 01-sync-rotas-contrato.md

Escopo coberto:
- Rotas offline-first em /sync com retorno em array direto.
- Rotas legacy em /sync/:id_propriedade com envelope data/meta e paginacao.
- Regras de autorizacao por vinculo do usuario com a propriedade.
- Suporte a sincronizacao incremental via updated_at.
- Inclusao de registros soft-deleted para limpeza do SQLite local.
