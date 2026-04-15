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

## REPRO-MAT-003 - Regras condicionais por origem sao aplicadas na camada de servico

- Contexto de negocio:
  Quando origem = Coleta Propria, espera-se idBufaloOrigem; quando origem = Compra, espera-se fornecedor.

- Regra principal:
  MaterialGeneticoService aplica validacao cruzada obrigatoria por origem em create e update.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException para combinacoes invalidas:
  - Coleta Propria sem idBufaloOrigem.
  - Coleta Propria com fornecedor informado.
  - Compra sem fornecedor.
  - Compra com idBufaloOrigem informado.

- Criterio de aceite:
  - DTO mantem campos opcionais para contrato flexivel.
  - Service chama validarCruzadaOrigem antes de persistir create/update.
  - update valida combinacao considerando estado atual + patch parcial.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/dto/create-material-genetico.dto.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/modules/reproducao/material-genetico/material-genetico.service.spec.ts

- Status:
  implementada

## REPRO-MAT-004 - Ownership por propriedade e validado explicitamente no subdominio material-genetico

- Contexto de negocio:
  Repositorio multi-tenant exige confirmar vinculo usuario x propriedade antes de operar.

- Regra principal:
  Endpoints de material genetico validam ownership com base no usuario autenticado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  - NotFoundException para registro sem propriedade vinculada.
  - Erro de acesso quando usuario nao possui vinculo com a propriedade.

- Criterio de aceite:
  - Controller injeta @User nos endpoints protegidos.
  - Service aplica validarOwnership (getUserId + validatePropriedadeAccess) em create/findByPropriedade/findOne/update/remove/restore.
  - Listagens globais usam getUserPropriedades para escopo por propriedades do usuario.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/material-genetico/material-genetico.controller.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/modules/reproducao/material-genetico/repositories/material-genetico.repository.drizzle.ts
  src/modules/reproducao/material-genetico/material-genetico.service.spec.ts

- Status:
  implementada

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
  NotFoundException/erro de acesso herdado do BufaloService, alem de mapeamento semantico de erro da IA (400/404/422/status propagado, indisponibilidade e timeout).

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
  NotFoundException/erro de acesso para femea invalida e mapeamento semantico de erros de IA (400/404/422/status propagado, indisponibilidade e timeout).

- Criterio de aceite:
  Resposta final contem femeaId, lista enriquecida, totalEncontrados e limiteConsanguinidade.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts
  src/modules/reproducao/genealogia/repositories/genealogia.repository.drizzle.ts

- Status:
  implementada

## REPRO-SIM-004 - Mapeamento de erro em simulacao preserva semantica para cenarios de negocio externos

- Contexto de negocio:
  Erros 400/404/422 vindos da IA representam cenarios de negocio e devem ser refletidos de forma semantica ao cliente.

- Regra principal:
  Camada de simulacao diferencia erros de validacao/nao-encontrado/timeout/indisponibilidade de falhas genericas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  - 404 da IA -> NotFoundException.
  - 400 da IA -> BadRequestException.
  - 422 da IA -> UnprocessableEntityException.
  - Outros status HTTP da IA -> HttpException com status original.
  - ECONNREFUSED -> ServiceUnavailableException.
  - ETIMEDOUT/ECONNABORTED/TimeoutError -> RequestTimeoutException.

- Criterio de aceite:
  Metodo handleIAError aplica mapeamento por tipo/status sem colapsar tudo em 500.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts

- Status:
  implementada

## REPRO-SIM-005 - Validacao de parametros no controller de simulacao e padronizada

- Contexto de negocio:
  Endpoints reprodutivos devem rejeitar parametros invalidos o quanto antes.

- Regra principal:
  IDs de rota e querys numericas sao normalizados com pipes/DTO tipados de forma consistente.

- Excecoes:
  DTO de POST continua validando UUID para idMacho/idFemea.

- Erros esperados:
  400 para UUID invalido em id_femea e para maxConsanguinidade fora do contrato numerico esperado.

- Criterio de aceite:
  - SimulacaoController aplica ParseUUIDPipe em id_femea no endpoint GET.
  - maxConsanguinidade e validado por EncontrarMachosCompativeisQueryDto (transformacao numerica + Min/Max).

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.controller.ts
  src/modules/reproducao/simulacao/dto/encontrar-machos-compativeis-query.dto.ts

- Status:
  implementada
