# GESTAO-PROPRIEDADE - Propriedades

## GPROP-PROP-001 - Criacao de propriedade vinculada ao dono autenticado

- Contexto de negocio:
  Propriedade deve ser criada em nome do proprietario autenticado para manter ownership correto.

- Regra principal:
  POST /propriedades deve resolver id do usuario via AuthHelperService e gravar como idDono.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException quando idEndereco nao existir (FK); InternalServerErrorException para falhas gerais de persistencia.

- Criterio de aceite:
  Service chama authHelper.getUserId(user), cria propriedade no repositorio e retorna payload formatado.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.controller.ts
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/propriedade/repositories/propriedade.repository.drizzle.ts

- Status:
  implementada

## GPROP-PROP-002 - Listagem consolida propriedades como dono e como funcionario

- Contexto de negocio:
  Usuario pode acessar propriedades por ownership direto ou por vinculo funcional.

- Regra principal:
  GET /propriedades deve buscar em paralelo propriedades como dono e como funcionario, combinar resultados e remover duplicatas por idPropriedade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erros de infraestrutura devem ser logados e propagados para tratamento global.

- Criterio de aceite:
  Service usa Promise.all, deduplica com Map e retorna total + lista formatada.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/propriedade/repositories/propriedade.repository.drizzle.ts

- Status:
  implementada

## GPROP-PROP-003 - Consulta individual valida acesso por propriedade

- Contexto de negocio:
  Consultar uma propriedade especifica sem acesso autorizado viola isolamento de tenant.

- Regra principal:
  GET /propriedades/:id deve validar acesso com validatePropriedadeAccess antes de retornar dados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para propriedade inexistente ou sem acesso.

- Criterio de aceite:
  Service valida acesso e so depois consulta buscarPorIdInterno.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## GPROP-PROP-004 - Atualizacao e remocao restritas ao dono

- Contexto de negocio:
  Alteracoes estruturais na propriedade exigem governanca do dono do registro.

- Regra principal:
  PATCH/DELETE /propriedades/:id devem aceitar apenas dono da propriedade alvo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException quando propriedade nao existe ou usuario nao e dono.

- Criterio de aceite:
  Service usa buscarPropriedadeComoDono antes de atualizar/remover.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.controller.ts
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/propriedade/repositories/propriedade.repository.drizzle.ts

- Status:
  implementada

## GPROP-PROP-005 - Remocao fisica de propriedade diverge do padrao de soft delete do schema

- Contexto de negocio:
  Schema de propriedade possui deletedAt e outras partes do modulo usam soft delete para auditoria.

- Regra principal:
  Remocao de propriedade deveria seguir estrategia explicita de soft delete (ou hard delete com cleanup consistente de dependencias).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erros de integridade referencial em cenarios com dependencias ativas.

- Criterio de aceite:
  No estado atual, repositorio executa delete fisico em propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/repositories/propriedade.repository.drizzle.ts
  src/database/schema.ts

- Status:
  parcial

## GPROP-PROP-006 - Cache de leitura nao e invalidado em alteracoes de propriedade

- Contexto de negocio:
  Leitura de propriedades e cacheada no controller; sem invalidacao, cliente pode ver dados stale apos update/delete.

- Regra principal:
  Fluxos de escrita deveriam invalidar chaves relacionadas a listagem/consulta de propriedade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual existe CacheTTL em GETs, mas nao ha invalidacao explicita no update/remove/create.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.controller.ts
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/core/cache/cache.service.ts

- Status:
  parcial
