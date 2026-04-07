# REPRODUCAO - Material Genetico e Simulacao

## REPRO-MAT-001 - Material genetico suporta ciclo CRUD com soft delete e restauracao

- Contexto de negocio:
  Estoque genetico precisa de rastreabilidade historica sem perda de registro fisico/logico.

- Regra principal:
  Modulo material-genetico implementa create, listagem paginada, busca por propriedade, update, soft delete, restore e listagem incluindo removidos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  - NotFoundException para id inexistente.
  - BadRequestException ao restaurar item nao removido.

- Criterio de aceite:
  Controller expoe rotas CRUD, e service/repository manipulam campo deletedAt para soft delete/restore.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/material-genetico.controller.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/modules/reproducao/material-genetico/repositories/material-genetico.repository.drizzle.ts

- Status:
  implementada

## REPRO-MAT-002 - Material genetico valida tipo, origem e data de coleta no contrato de entrada

- Contexto de negocio:
  Controle de origem e tipo do material evita uso indevido na reproducao.

- Regra principal:
  DTO de criacao valida idPropriedade (UUID), tipo (Semen/Embriao/Ovulo), origem (Coleta Propria/Compra) e data nao futura.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erros de validacao de DTO para enums invalidos, UUID invalido ou data futura.

- Criterio de aceite:
  CreateMaterialGeneticoDto aplica class-validator e IsNotFutureDate.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/dto/create-material-genetico.dto.ts
  src/core/validators/date.validators.ts

- Status:
  implementada

## REPRO-MAT-003 - Regras condicionais por origem ainda nao estao completas na camada de servico

- Contexto de negocio:
  Quando origem = Coleta Propria, espera-se idBufaloOrigem; quando origem = Compra, espera-se fornecedor.

- Regra principal:
  Service deveria impor validacao cruzada obrigatoria entre origem e campos condicionais.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, payload pode passar sem idBufaloOrigem ou sem fornecedor, dependendo da origem informada.

- Criterio de aceite:
  CreateMaterialGeneticoDto marca idBufaloOrigem e fornecedor como opcionais, e MaterialGeneticoService nao impoe regra cruzada obrigatoria.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/dto/create-material-genetico.dto.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts

- Status:
  parcial

## REPRO-MAT-004 - Ownership por propriedade nao e validado explicitamente no subdominio material-genetico

- Contexto de negocio:
  Repositorio multi-tenant exige confirmar vinculo usuario x propriedade antes de operar.

- Regra principal:
  Endpoints de material genetico deveriam validar ownership com base no usuario autenticado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, fluxo nao injeta usuario no service para validar vinculo da propriedade.

- Criterio de aceite:
  Controller/service nao recebem @User nem usam helper central de autorizacao por propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/material-genetico.controller.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts

- Status:
  parcial

## REPRO-SIM-001 - Simulacao exige IA_API_URL na inicializacao do modulo

- Contexto de negocio:
  Simulacao depende integralmente de API externa de IA para analise genetica.

- Regra principal:
  SimulacaoService valida IA_API_URL no onModuleInit e interrompe inicializacao se variavel nao estiver configurada.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Error de inicializacao do modulo quando IA_API_URL estiver ausente.

- Criterio de aceite:
  onModuleInit verifica variavel de ambiente e lanca erro quando valor nao existe.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts

- Status:
  implementada

## REPRO-SIM-002 - Simular acasalamento valida existencia dos animais e delega predicao para IA

- Contexto de negocio:
  Predicao genetica exige validar que macho e femea existem e sao acessiveis antes da chamada externa.

- Regra principal:
  preverPotencial usa BufaloService.findOne para idMacho e idFemea com contexto do usuario autenticado, depois envia payload para endpoint /simular-acasalamento.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException/erro de acesso herdado do BufaloService ou InternalServerErrorException em falha da IA.

- Criterio de aceite:
  Metodo valida ambos os IDs antes de chamar IA e retorna resposta da predicao.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts
  src/modules/rebanho/bufalo/bufalo.service.ts

- Status:
  implementada

## REPRO-SIM-003 - Busca de machos compativeis combina IA externa com enriquecimento local

- Contexto de negocio:
  Ranking final precisa incluir contexto amigavel (nome do macho) para decisao operacional.

- Regra principal:
  encontrarMachosCompativeis consulta IA por limite de consanguinidade, enriquece com nomes locais e retorna score de compatibilidade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException para falha de IA, timeout ou indisponibilidade.

- Criterio de aceite:
  Resposta final contem femeaId, lista enriquecida, totalEncontrados e limiteConsanguinidade.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts
  src/modules/reproducao/genealogia/repositories/genealogia.repository.drizzle.ts

- Status:
  implementada

## REPRO-SIM-004 - Mapeamento de erro em simulacao ainda retorna 500 para cenarios de negocio externos

- Contexto de negocio:
  Erros 400/404/422 vindos da IA podem representar validacao de entrada e deveriam ser refletidos de forma mais semantica ao cliente.

- Regra principal:
  Camada de simulacao deveria diferenciar erros de validacao/nao-encontrado de falhas internas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, handleIAError converte cenarios 400/404/422 em InternalServerErrorException, reduzindo granularidade de contrato.

- Criterio de aceite:
  Metodo handleIAError sempre lanca InternalServerErrorException.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts

- Status:
  parcial

## REPRO-SIM-005 - Validacao de parametros no controller de simulacao e heterogenea

- Contexto de negocio:
  Endpoints reprodutivos devem rejeitar parametros invalidos o quanto antes.

- Regra principal:
  IDs de rota e querys numericas deveriam ser normalizados com pipes tipados de forma consistente.

- Excecoes:
  DTO de POST ja valida UUID para idMacho/idFemea.

- Erros esperados:
  No estado atual, GET machos-compativeis usa @Param sem ParseUUIDPipe e parseFloat manual na query, deixando validacao menos padronizada.

- Criterio de aceite:
  SimulacaoController nao aplica ParseUUIDPipe em id_femea no endpoint GET.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.controller.ts
  src/modules/reproducao/simulacao/dto/encontrar-machos-compativeis.dto.ts

- Status:
  parcial
