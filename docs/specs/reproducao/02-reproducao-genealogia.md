# REPRODUCAO - Genealogia

## REPRO-GEN-001 - Consulta de arvore genealogica exige verificacao de acesso por propriedade

- Contexto de negocio:
  Genealogia revela parentesco e decisao de acasalamento, portanto deve respeitar escopo do usuario.

- Regra principal:
  Antes de montar arvore, o sistema valida se usuario e dono da propriedade do bufalo ou funcionario vinculado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  - NotFoundException para bufalo inexistente.
  - ForbiddenException para usuario sem vinculo com a propriedade do animal.

- Criterio de aceite:
  buildTree chama verificarAcessoBufalo antes da montagem recursiva.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.service.ts
  src/core/services/user-mapping.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts
  src/modules/usuario/repositories/helper/propriedade.repository.helper.ts

- Status:
  implementada

## REPRO-GEN-002 - Arvore genealogica e montada de forma recursiva com limite de profundidade

- Contexto de negocio:
  A analise de parentesco precisa navegar em geracoes de ancestrais sem estourar consulta infinita.

- Regra principal:
  construirArvoreCompleta e construirArvoreParaCategoria fazem recursao controlada por parametro de geracoes, buscando pai e mae em paralelo.

- Excecoes:
  Sem pai ou mae cadastrados retornam null no respectivo ramo.

- Erros esperados:
  Sem erro quando faltam ancestrais; retorna arvore parcial valida.

- Criterio de aceite:
  Metodos recursivos decrementam profundidade e interrompem quando limite e atingido.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.service.ts
  src/modules/reproducao/genealogia/repositories/genealogia.repository.drizzle.ts

- Status:
  implementada

## REPRO-GEN-003 - Endpoints de analise e machos compativeis validam acesso antes de chamar IA

- Contexto de negocio:
  Chamadas de IA devem ocorrer apenas para recursos autorizados, evitando vazamento de dados para usuarios sem permissao.

- Regra principal:
  Controller executa validacao de acesso via buildTree com profundidade minima antes de delegar para GenealogiaIAService.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Mesmos erros de autorizacao/encontrabilidade do fluxo de buildTree.

- Criterio de aceite:
  analisarConsanguinidade e encontrarMachosCompativeis executam pre-check de acesso no GenealogiaService.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.controller.ts
  src/modules/reproducao/genealogia/genealogia.service.ts

- Status:
  implementada

## REPRO-GEN-004 - Integracao com IA usa timeout e enriquecimento de resposta

- Contexto de negocio:
  Analise genetica externa precisa ser resiliente e retornar payload util para decisao tecnica.

- Regra principal:
  GenealogiaIAService chama API externa com timeout, injeta x-user-id, e enriquece resposta de machos compativeis com nomes locais.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falhas de rede/timeout e erros HTTP da IA resultam em erro da aplicacao com mensagem amigavel.

- Criterio de aceite:
  Metodos analisarGenealogiaCompleta e encontrarMachosCompativeis fazem chamada HTTP, aplicam timeout e retornam payload tratado.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia-ia.service.ts
  src/modules/reproducao/genealogia/repositories/genealogia.repository.drizzle.ts

- Status:
  implementada

## REPRO-GEN-005 - Cache de leitura e aplicado em endpoints de genealogia

- Contexto de negocio:
  Arvore genealogica e recomendacoes de machos podem gerar carga alta e repetitiva em consulta e IA.

- Regra principal:
  Controller aplica CacheInterceptor com TTL de 5 min para arvore/machos e 10 min para analise genealogica.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Endpoints possuem anotacoes @UseInterceptors(CacheInterceptor) e @CacheTTL configuradas.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.controller.ts

- Status:
  implementada

## REPRO-GEN-006 - Mapeamento de erros da IA ainda nao padroniza resposta HTTP de dominio

- Contexto de negocio:
  Erros de integracao com IA devem ser traduzidos para excecoes HTTP consistentes no backend Nest.

- Regra principal:
  Falhas externas deveriam ser convertidas para HttpException com status semantico por tipo de erro.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, GenealogiaIAService usa throw new Error em vez de HttpException, reduzindo padronizacao de contrato de erro.

- Criterio de aceite:
  handleIAError do GenealogiaIAService lanca Error generico para varios cenarios.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia-ia.service.ts

- Status:
  parcial
