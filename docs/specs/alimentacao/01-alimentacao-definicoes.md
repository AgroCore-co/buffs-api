# ALIMENTACAO - Definicoes

## ALIM-DEF-001 - Criacao de definicao de alimentacao

- Contexto de negocio:
  Registros operacionais dependem de um catalogo padronizado de tipos de alimentacao por propriedade.

- Regra principal:
  POST /alimentacoes-def deve criar definicao mapeando campos snake_case do DTO para camelCase do schema.

- Excecoes:
  descricao e opcional.

- Erros esperados:
  InternalServerErrorException em falha de persistencia.

- Criterio de aceite:
  Resposta retorna objeto criado com id gerado e datas formatadas.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts
  src/modules/alimentacao/alimentacao-def/alimentacao-def.service.ts
  src/modules/alimentacao/alimentacao-def/repositories/alimentacao-def.repository.drizzle.ts

- Status:
  implementada

## ALIM-DEF-002 - Listagem paginada por propriedade

- Contexto de negocio:
  Catalogo pode crescer ao longo do tempo e precisa de paginacao para consumo eficiente.

- Regra principal:
  GET /alimentacoes-def/propriedade/:id_propriedade deve retornar resposta paginada com total, pagina e limite.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException para falhas de count/list.

- Criterio de aceite:
  Service executa count e list da propriedade, formata dados e retorna PaginatedResponse.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.service.ts
  src/modules/alimentacao/alimentacao-def/repositories/alimentacao-def.repository.drizzle.ts

- Status:
  implementada

## ALIM-DEF-003 - Cache de leitura para definicoes

- Contexto de negocio:
  Definicoes mudam menos que registros e podem ser cacheadas com TTL maior.

- Regra principal:
  Endpoint por propriedade usa CacheTTL 1800s e endpoint por id usa CacheTTL 3600s.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Decorators CacheTTL aplicados nos endpoints de listagem/consulta do controller.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.controller.ts

- Status:
  implementada

## ALIM-DEF-004 - Atualizacao e remocao exigem existencia previa

- Contexto de negocio:
  Atualizar/remover registro inexistente precisa retorno consistente para cliente.

- Regra principal:
  Service deve chamar findOne antes de update/remove e retornar 404 quando definicao nao existir.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para recurso inexistente; InternalServerErrorException para falha de update/remove.

- Criterio de aceite:
  update e remove fazem pre-validacao de existencia antes da operacao final.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/alimentacao-def.service.ts

- Status:
  implementada

## ALIM-DEF-005 - id_propriedade nao deve ser alterado no update

- Contexto de negocio:
  Definicao pertence a uma propriedade e migracao entre propriedades deve ser fluxo explicito, nao update comum.

- Regra principal:
  Ainda que DTO de update herde campos do create, repositorio deve ignorar id_propriedade na atualizacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Implementacao de update atualiza somente tipo_alimentacao e descricao (mais updatedAt).

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/dto/update-alimentacao-def.dto.ts
  src/modules/alimentacao/alimentacao-def/repositories/alimentacao-def.repository.drizzle.ts

- Status:
  implementada
