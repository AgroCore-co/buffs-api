# USUARIO - Repositorios e Persistencia

## USR-REPO-001 - Repositorio de usuario deve mapear CRUD com join de endereco

- Contexto de negocio:
  Perfil de usuario inclui dados cadastrais e pode incluir endereco associado.

- Regra principal:
  UsuarioRepositoryDrizzle deve suportar criar, buscar por email/auth/id, listar, atualizar e remover usuario, incluindo left join com endereco nas consultas de leitura.

- Excecoes:
  Endereco pode ser nulo.

- Erros esperados:
  Nao aplicavel no nivel de repositorio; erros sobem para service/controller.

- Criterio de aceite:
  Metodos buscarPorEmail, buscarPorId e listarTodos retornam objeto de usuario com endereco opcional.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/repositories/usuario.repository.drizzle.ts
  src/database/schema.ts

- Status:
  implementada

## USR-REPO-002 - Ownership de propriedade considera soft delete em propriedade helper

- Contexto de negocio:
  Propriedades removidas logicamente nao devem ser consideradas para autorizacao.

- Regra principal:
  PropriedadeRepositoryHelper deve filtrar deletedAt is null nas consultas de listarPorDono e pertenceAoDono.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Consultas usam and(..., isNull(propriedade.deletedAt)).

- Rastreabilidade para codigo e testes:
  src/modules/usuario/repositories/helper/propriedade.repository.helper.ts
  src/database/schema.ts

- Status:
  implementada

## USR-REPO-003 - Repositorio de usuario-propriedade deve suportar leitura por usuario e por propriedade

- Contexto de negocio:
  Vinculo N:N entre usuario e propriedade e base para autorizacao e consultas operacionais.

- Regra principal:
  UsuarioPropriedadeRepositoryDrizzle deve permitir vincular, listar propriedades por usuario, listar usuarios por propriedade(s), checar vinculo e desvincular.

- Excecoes:
  Listagem por multiplas propriedades deve retornar vazio quando lista de IDs estiver vazia.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Repositorio contem metodos vincular, listarPropriedadesPorUsuario, listarUsuariosPorPropriedade, listarUsuariosPorPropriedades, estaVinculado e desvincular.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts
  src/database/schema.ts

- Status:
  implementada

## USR-REPO-004 - Vinculacao em lote deveria tratar duplicidade de forma idempotente

- Contexto de negocio:
  Fluxos de cadastro/reprocessamento podem tentar gravar vinculo ja existente.

- Regra principal:
  Operacao de vincular deveria ser idempotente (ignore/upsert) ou mapear conflito para erro de dominio controlado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Conflito de chave primaria composta em usuariopropriedade quando ha duplicidade.

- Criterio de aceite:
  No estado atual, vincular faz insert direto sem tratamento explicito de duplicidade.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts
  src/database/schema.ts

- Status:
  parcial

## USR-REPO-005 - Exclusao de usuario local e fisica e nao segue padrao de soft delete

- Contexto de negocio:
  Outros modulos do projeto adotam soft delete para preservar historico e auditoria.

- Regra principal:
  Dominio de usuario deveria definir explicitamente estrategia de remocao (soft delete ou hard delete com cleanup completo).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, repositorio usa delete fisico em usuario e tabela usuario nao possui deletedAt.

- Rastreabilidade para codigo e testes:
  src/modules/usuario/repositories/usuario.repository.drizzle.ts
  src/database/schema.ts

- Status:
  parcial
