# REPRODUCAO - DTOs e Validacoes

## REPRO-DTO-001 - DTO de cobertura valida identificadores, data e enums de processo reprodutivo

- Contexto de negocio:
  Registro de cobertura exige consistencia minima de propriedade, animais e classificacoes operacionais.

- Regra principal:
  CreateCoberturaDto valida UUIDs relevantes, data de evento nao futura, tipoInseminacao e status dentro de enums permitidos.

- Excecoes:
  idBufalo, idSemen e idDoadora sao opcionais no contrato, com obrigatoriedade final aplicada no service conforme tecnica.

- Erros esperados:
  Erro de validacao para UUID invalido, enum invalido ou data futura.

- Criterio de aceite:
  DTO usa class-validator e IsNotFutureDate.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/dto/create-cobertura.dto.ts
  src/core/validators/date.validators.ts

- Status:
  implementada

## REPRO-DTO-002 - DTO de update da cobertura restringe tipo de parto a valores permitidos

- Contexto de negocio:
  Fechamento do ciclo reprodutivo depende de classificacao padronizada do desfecho do parto.

- Regra principal:
  UpdateCoberturaDto aceita tipo_parto apenas em: Normal, Cesarea, Aborto.

- Excecoes:
  Campos herdados de CreateCoberturaDto continuam opcionais via PartialType.

- Erros esperados:
  Erro de validacao para tipo_parto fora do enum.

- Criterio de aceite:
  DTO aplica @IsIn para tipo_parto.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/dto/update-cobertura.dto.ts

- Status:
  implementada

## REPRO-DTO-003 - DTO de registrar parto define pre-condicoes de entrada para criar ciclo

- Contexto de negocio:
  Fechamento de cobertura e abertura de ciclo de lactacao exigem data e tipo de parto validos.

- Regra principal:
  RegistrarPartoDto exige dt_parto e tipo_parto, e permite configurar observacao, criar_ciclo_lactacao e padrao_dias_lactacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Erro de validacao para data invalida ou padrao_dias_lactacao nao positivo.

- Criterio de aceite:
  DTO aplica IsDateString, IsIn, IsBoolean, IsInt e IsPositive conforme campo.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/dto/registrar-parto.dto.ts

- Status:
  implementada

## REPRO-DTO-004 - DTOs de simulacao validam UUIDs e faixa de consanguinidade

- Contexto de negocio:
  Simulacoes devem receber identificadores validos e limite genetico em faixa segura.

- Regra principal:
  - SimularAcasalamentoDto exige UUID valido para idMacho e idFemea.
  - EncontrarMachosCompativeisDto define maxConsanguinidade opcional entre 0 e 100.

- Excecoes:
  maxConsanguinidade assume default 6.25 quando nao informado.

- Erros esperados:
  Erro de validacao para UUID invalido ou valor fora da faixa permitida.

- Criterio de aceite:
  DTOs usam IsUUID, IsNumber, Min, Max e Transform.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/dto/simular-acasalamento.dto.ts
  src/modules/reproducao/simulacao/dto/encontrar-machos-compativeis.dto.ts

- Status:
  implementada

## REPRO-DTO-005 - DTO de material genetico cobre validacao basica, mas sem regra cruzada obrigatoria por origem

- Contexto de negocio:
  Campos condicionais de origem (coleta propria x compra) deveriam ser obrigatorios conforme contexto de aquisicao.

- Regra principal:
  Contrato atual valida tipos/enums/data, mas nao obriga idBufaloOrigem quando origem e Coleta Propria nem fornecedor quando origem e Compra.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, payload pode passar por validacao estrutural sem atender regra cruzada de negocio.

- Criterio de aceite:
  idBufaloOrigem e fornecedor permanecem opcionais sem validador condicional no DTO/service.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/dto/create-material-genetico.dto.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts

- Status:
  parcial

## REPRO-DTO-006 - DTO de resposta genealogica diverge do tipo real de identificador

- Contexto de negocio:
  Contrato de API precisa refletir tipo real de ID para evitar erros de integracao com cliente.

- Regra principal:
  Campo id em GenealogiaNodeDto deveria refletir UUID string retornado em runtime.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, DTO documenta id como number, enquanto service popula id com string UUID.

- Criterio de aceite:
  Incompatibilidade entre tipagem de GenealogiaNodeDto e valor montado em converterParaGenealogiaNode.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/dto/genealogia-response.dto.ts
  src/modules/reproducao/genealogia/genealogia.service.ts

- Status:
  parcial

## REPRO-DTO-007 - Normalizacao de parametros em controllers nao e uniforme

- Contexto de negocio:
  Aplicacao de pipes padronizados reduz variacao de erro e simplifica contrato HTTP.

- Regra principal:
  Endpoints de reproducao deveriam aplicar ParseUUIDPipe/ParseIntPipe/ParseFloatPipe de forma consistente para parametros de rota e query.

- Excecoes:
  GenealogiaController aplica pipes tipados de forma robusta.

- Erros esperados:
  No estado atual, ha rotas sem pipe tipado em simulacao e parametros numericos sem parse explicito em algumas rotas de cobertura.

- Criterio de aceite:
  SimulacaoController nao aplica ParseUUIDPipe em id_femea; cobertura usa limit opcional sem pipe nos endpoints de recomendacao.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.controller.ts
  src/modules/reproducao/cobertura/cobertura.controller.ts
  src/modules/reproducao/genealogia/genealogia.controller.ts

- Status:
  parcial

## REPRO-TEST-001 - Nao ha suite automatizada dedicada ao modulo de reproducao

- Contexto de negocio:
  Regras de reproducao e genetica possuem alto impacto de negocio e pedem cobertura de regressao.

- Regra principal:
  Modulo deveria possuir testes unitarios/e2e dedicados para cobertura, genealogia, material-genetico e simulacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Ausencia de testes aumenta risco de regressao silenciosa em validacoes e calculos de score.

- Criterio de aceite:
  Nao foram encontrados arquivos de teste em test/ ou src/modules/reproducao com escopo dedicado ao modulo.

- Rastreabilidade para codigo e testes:
  test/
  src/modules/reproducao/

- Status:
  parcial
