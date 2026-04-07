# PRODUCAO - Lactacao e Ordenha

## PROD-LACT-001 - Criacao de ciclo calcula secagem prevista e status automaticamente

- Contexto de negocio:
  O ciclo de lactacao precisa manter previsao de secagem padrao e status coerente com a data de secagem real.

- Regra principal:
  Na criacao e atualizacao do ciclo, o service deve recalcular dtSecagemPrevista com base em dtParto + padraoDias e recalcular status para Em Lactacao ou Seca.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falhas de persistencia.

- Criterio de aceite:
  - computeSecagemPrevista e chamado em create/update.
  - computeStatus usa dtSecagemReal para definir status.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/lactacao/repositories/lactacao.repository.drizzle.ts

- Status:
  implementada

## PROD-LACT-002 - Alertas de ciclo sao emitidos por regras temporais de producao

- Contexto de negocio:
  O acompanhamento de lactacao depende de alertas preventivos para manejo.

- Regra principal:
  LactacaoService deve disparar alertas para ciclo prolongado, proxima secagem, secagem atrasada e ciclo curto.

- Excecoes:
  Alertas nao bloqueiam operacao principal em caso de falha de integracao.

- Erros esperados:
  Falhas no alerta sao registradas em log sem interromper create/update do ciclo.

- Criterio de aceite:
  - verificarAlertasCiclo e acionado apos create/update.
  - Prioridade varia conforme dias para secagem/atraso.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/alerta/alerta.service.ts

- Status:
  implementada

## PROD-LACT-003 - Listagem por propriedade enriquece ciclo com metadados de negocio

- Contexto de negocio:
  A visao operacional da propriedade precisa destacar ciclo atual, dias em lactacao e identificacao da bufala.

- Regra principal:
  findByPropriedade deve retornar pagina de ciclos com dados enriquecidos (diasEmLactacao, cicloAtual e dados da bufala).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falha de consulta.

- Criterio de aceite:
  - Repositorio faz join com bufalo/raca e ordena Em Lactacao primeiro.
  - Service calcula diasEmLactacao e mapeia cicloAtual por bufala.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/lactacao/repositories/lactacao.repository.drizzle.ts

- Status:
  implementada

## PROD-LACT-004 - Estatisticas de propriedade consolidam situacao dos ciclos

- Contexto de negocio:
  A propriedade precisa monitorar quantidade de ciclos ativos/secos e risco de secagem atrasada.

- Regra principal:
  getEstatisticasPropriedade deve retornar totais de ciclos, media de dias em lactacao, ciclos proximos da secagem e ciclos atrasados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falha de leitura.

- Criterio de aceite:
  Endpoint de estatisticas retorna agregados calculados a partir dos ciclos ativos da propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/lactacao.controller.ts
  src/modules/producao/lactacao/lactacao.service.ts
  src/modules/producao/lactacao/repositories/lactacao.repository.drizzle.ts

- Status:
  implementada

## PROD-ORDE-001 - Registro de ordenha exige bufala valida e persiste autoria

- Contexto de negocio:
  Cada ordenha precisa ser rastreavel por animal, ciclo, propriedade e usuario que registrou.

- Regra principal:
  OrdenhaService.create deve obter id do usuario autenticado e registrar controle leiteiro com idBufala/idCicloLactacao/idPropriedade validados por DTO.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException quando a bufala nao existe.

- Criterio de aceite:
  - Service usa AuthHelperService.getUserId.
  - Repositorio persiste idUsuario no insert.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/ordenha/repositories/ordenha.repository.drizzle.ts
  src/modules/producao/ordenha/dto/create-ordenha.dto.ts

- Status:
  implementada

## PROD-ORDE-002 - Ocorrencia em ordenha gera alerta com prioridade contextual

- Contexto de negocio:
  Ocorrencias de ordenha podem indicar risco sanitario e precisam gerar notificacao automatica.

- Regra principal:
  Se createDto.ocorrencia existir, o service deve gerar alerta com prioridade:
  ALTA para palavras mastite/sangue/infeccao,
  BAIXA para leve/normal,
  MEDIA nos demais casos.

- Excecoes:
  Falha ao criar alerta nao interrompe criacao da ordenha.

- Erros esperados:
  Nao aplicavel para fluxo principal (erro de alerta e somente logado).

- Criterio de aceite:
  Metodo criarAlertaOcorrencia monta CreateAlertaDto e chama alertasService.createIfNotExists.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/alerta/dto/create-alerta.dto.ts
  src/modules/alerta/alerta.service.ts

- Status:
  implementada

## PROD-ORDE-003 - Consultas por bufala e ciclo validam acesso a propriedade

- Contexto de negocio:
  Informacoes de producao individual nao devem ser retornadas sem validar escopo de propriedade do usuario.

- Regra principal:
  findAllByBufala e findAllByCiclo devem validar acesso via AuthHelperService.validatePropriedadeAccess antes de consultar dados paginados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para bufala/ciclo inexistente e erro de autorizacao para propriedade nao permitida.

- Criterio de aceite:
  Os dois fluxos fazem validacao de propriedade antes da chamada de listagem no repositorio.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/core/services/auth-helper.service.ts
  src/modules/producao/ordenha/repositories/ordenha.repository.drizzle.ts
  src/modules/producao/lactacao/repositories/lactacao.repository.drizzle.ts

- Status:
  implementada

## PROD-ORDE-004 - Lista de femeas em lactacao classifica desempenho relativo

- Contexto de negocio:
  O manejo diario precisa priorizar animais com desempenho abaixo/acima da media do rebanho.

- Regra principal:
  findFemeasEmLactacao deve calcular producao por animal, media do rebanho e classificar cada femea como Otima, Boa, Mediana ou Ruim por faixas percentuais.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Classificacao segue limiares: >=120% (Otima), >=100% (Boa), >=80% (Mediana), <80% (Ruim).

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/ordenha/dto/femea-em-lactacao.dto.ts

- Status:
  implementada

## PROD-ORDE-005 - Resumo da bufala consolida ciclo atual, historico e serie temporal

- Contexto de negocio:
  Analise de produtividade individual exige visao consolidada por ciclo e por periodo recente.

- Regra principal:
  getResumoProducaoBufala deve retornar:
  dados da bufala,
  ciclo atual com total/media/ultima ordenha,
  comparativo de ciclos secos,
  grafico de producao dos ultimos 30 dias.

- Excecoes:
  ciclo_atual pode ser null quando nao houver ciclo ativo.

- Erros esperados:
  NotFoundException quando bufala nao existir.

- Criterio de aceite:
  Service consulta repositorio de ciclos e ordenhas para montar resposta composta.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/ordenha/repositories/ordenha.repository.drizzle.ts
  src/modules/producao/ordenha/dto/resumo-producao-bufala.dto.ts

- Status:
  implementada

## PROD-ORDE-006 - Pre-condicao de ciclo ativo esta documentada, mas nao aplicada no create

- Contexto de negocio:
  Ordenha deveria ocorrer somente quando o animal esta em ciclo de lactacao ativo.

- Regra principal:
  O endpoint declara pre-requisito de ciclo ativo, porem o service de criacao nao valida explicitamente status do ciclo antes de inserir a ordenha.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, pode haver insercao com idCicloLactacao valido sem checagem de status Em Lactacao.

- Criterio de aceite:
  - A descricao da rota cita pre-requisito de ciclo ativo.
  - Nao ha validacao explicita de status no metodo create.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/ordenha.controller.ts
  src/modules/producao/ordenha/ordenha.service.ts
  src/modules/producao/lactacao/repositories/lactacao.repository.drizzle.ts

- Status:
  parcial
