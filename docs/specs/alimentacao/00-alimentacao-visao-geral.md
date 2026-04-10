# ALIMENTACAO - Visao Geral

## ALIM-ARCH-001 - Modulo alimentacao compoe dois subdominios

- Contexto de negocio:
  Regras de catalogo de alimento e regras de registro operacional evoluem em ritmos diferentes.

- Regra principal:
  AlimentacaoModule deve compor AlimentacaoDefModule (catalogo) e RegistrosModule (eventos de fornecimento).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI se submodulos nao forem importados/exportados corretamente.

- Criterio de aceite:
  Modulo raiz de alimentacao importa e exporta ambos os submodulos.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao.module.ts

- Status:
  implementada

## ALIM-ARCH-002 - Endpoints protegidos por autenticacao

- Contexto de negocio:
  Dados de alimentacao sao operacionais e nao devem ser expostos anonimamente.

- Regra principal:
  Controllers de definicoes e registros devem exigir SupabaseAuthGuard.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token ausente/invalido.

- Criterio de aceite:
  Ambos os controllers estao anotados com @UseGuards(SupabaseAuthGuard).

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts
  src/modules/alimentacao/registros/registros.controller.ts

- Status:
  implementada

## ALIM-ARCH-003 - Remocao logica no repositorio

- Contexto de negocio:
  Historico de alimentacao precisa ser preservado para auditoria e analise.

- Regra principal:
  Operacoes de remove devem realizar soft delete via deletedAt (e updatedAt quando aplicavel), em vez de exclusao fisica.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erro de nao encontrado quando registro ja removido ou inexistente.

- Criterio de aceite:
  Repositorios de definicoes e registros atualizam deletedAt em remove e filtram isNull(deletedAt) em consultas.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/repositories/alimentacao-def.repository.drizzle.ts
  src/modules/alimentacao/registros/repositories/registros.repository.drizzle.ts

- Status:
  implementada

## ALIM-SEC-001 - Ownership por propriedade no modulo alimentacao

- Contexto de negocio:
  Em modelo multi-tenant, usuario autenticado nao deve operar dados de propriedade sem vinculo.

- Regra principal:
  Endpoints devem validar associacao usuario-propriedade antes de listar/criar/atualizar/remover por id_propriedade e em operacoes por id.

- Excecoes:
  Sem excecoes de negocio.

- Erros esperados:
  403/404 quando usuario nao tiver acesso a propriedade alvo.

- Criterio de aceite:
  Controllers resolvem id do usuario autenticado via AuthHelperService e os services validam ownership por propriedade em create/list/findOne/update/remove.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts
  src/modules/alimentacao/alimentacao-def/alimentacao-def.service.ts
  src/modules/alimentacao/registros/registros.controller.ts
  src/modules/alimentacao/registros/registros.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada
