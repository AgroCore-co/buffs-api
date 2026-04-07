# REPRODUCAO - Cobertura

## REPRO-COB-001 - Tipo de tecnica reprodutiva define combinacao valida de campos

- Contexto de negocio:
  Cada tecnica (Monta Natural, IA, IATF, TE) exige entidades diferentes para manter consistencia biologica.

- Regra principal:
  - Monta Natural: exige idBufalo e proibe idSemen/idDoadora.
  - IA e IATF: exigem idSemen e proibem idDoadora.
  - TE: exige idSemen e idDoadora.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException com mensagem especifica para combinacao invalida.

- Criterio de aceite:
  Criacao de cobertura bloqueia payload inconsistente com tecnica selecionada.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/dto/create-cobertura.dto.ts

- Status:
  implementada

## REPRO-COB-002 - Femea receptora passa por validacoes zootecnicas antes da cobertura

- Contexto de negocio:
  Cobertura em femea inapta aumenta risco sanitario e reduz taxa de sucesso.

- Regra principal:
  Para idBufala, o fluxo valida: animal ativo, ausencia de gestacao em andamento, idade minima, idade maxima e intervalo entre partos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException quando qualquer validacao falhar.

- Criterio de aceite:
  CoberturaService chama CoberturaValidatorDrizzle antes de inserir registro.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/validators/cobertura.validator.drizzle.ts

- Status:
  implementada

## REPRO-COB-003 - Macho, doadora e material genetico possuem validacoes especificas

- Contexto de negocio:
  O uso incorreto de reprodutor, doadora ou tipo de material genetico invalida o procedimento reprodutivo.

- Regra principal:
  - Macho em Monta Natural deve ser animal ativo, sexo M e dentro da janela etaria.
  - Doadora em TE deve ser animal ativo, sexo F e dentro da janela etaria.
  - Material genetico deve existir, estar ativo e ser compativel com a tecnica:
    - IA/IATF aceitam apenas tipo "Semen".
    - TE aceita apenas tipo "Embriao".

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException para id inexistente, animal inativo, sexo incorreto ou tipo de material inadequado.

- Criterio de aceite:
  Service bloqueia criacao de cobertura antes do insert quando encontrar inconsistencias de sexo/tipo/atividade.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/validators/cobertura.validator.drizzle.ts
  src/modules/reproducao/material-genetico/repositories/material-genetico.repository.drizzle.ts

- Status:
  implementada

## REPRO-COB-004 - Gestacao em andamento bloqueia nova cobertura para a mesma femea

- Contexto de negocio:
  Uma femea com cobertura "Em andamento" nao deve receber nova cobertura ate encerramento do ciclo.

- Regra principal:
  CoberturaValidatorDrizzle deve impedir nova cobertura quando existir registro "Em andamento" sem soft delete.

- Excecoes:
  Status "Confirmada", "Falha" e "Concluida" nao bloqueiam criacao de novo registro.

- Erros esperados:
  BadRequestException informando cobertura ativa existente.

- Criterio de aceite:
  Query filtra por idBufala + status "Em andamento" + deletedAt nulo antes da insercao.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/validators/cobertura.validator.drizzle.ts

- Status:
  implementada

## REPRO-COB-005 - Registro de parto finaliza cobertura e pode abrir ciclo de lactacao com alerta

- Contexto de negocio:
  O fechamento do evento reprodutivo precisa atualizar estado da cobertura e iniciar manejo de lactacao.

- Regra principal:
  Endpoint registrarParto exige cobertura "Confirmada", atualiza para "Concluida" e registra tipo_parto. Em partos "Normal" ou "Cesarea", o fluxo pode criar ciclo de lactacao e alerta automatico de secagem.

- Excecoes:
  Em "Aborto", nao cria ciclo de lactacao.

- Erros esperados:
  - BadRequestException se cobertura nao estiver "Confirmada".
  - InternalServerErrorException se falhar atualizacao da cobertura.

- Criterio de aceite:
  Fluxo retorna cobertura atualizada e, quando aplicavel, ciclo_lactacao e mensagem de alerta agendado.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.controller.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/dto/registrar-parto.dto.ts
  src/modules/alerta/alerta.service.ts

- Status:
  implementada

## REPRO-COB-006 - Listagem de femeas disponiveis aplica filtros operacionais de reproducao

- Contexto de negocio:
  Planejamento de cobertura depende de identificar femeas elegiveis por status reprodutivo atual.

- Regra principal:
  findFemeasDisponiveisReproducao monta status e recomendacoes por animal e filtra por modo: todas, solteiras, vazias ou aptas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem erro quando nao houver femeas elegiveis; retorna lista vazia.

- Criterio de aceite:
  Resultado inclui idade, raca, ultima cobertura, ciclo atual e recomendacoes por femea.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.controller.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/dto/femea-disponivel-reproducao.dto.ts

- Status:
  implementada

## REPRO-COB-007 - Recomendacao de femeas usa IAR com pesos fixos

- Contexto de negocio:
  Priorizar femeas para acasalamento exige criterio objetivo, auditavel e replicavel.

- Regra principal:
  Score IAR e calculado com pesos:
  - FP_Prontidao: 50%
  - FP_Idade: 15%
  - FP_Historico: 20%
  - FP_Lactacao: 15%

- Excecoes:
  Novilhas sem historico recebem baseline no fator historico.

- Erros esperados:
  Sem erro para historico incompleto; algoritmo usa defaults definidos no utilitario.

- Criterio de aceite:
  Endpoint de recomendacoes de femeas retorna ranking ordenado por score descrescente com justificativas.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/utils/calcular-iar.util.ts
  src/modules/reproducao/cobertura/utils/reproducao-queries-drizzle.util.ts
  src/modules/reproducao/cobertura/dto/recomendacao-acasalamento.dto.ts

- Status:
  implementada

## REPRO-COB-008 - Recomendacao de machos usa IVR com ajuste bayesiano

- Contexto de negocio:
  Selecionar reprodutor apenas por taxa bruta pode superestimar touros com pouca amostra.

- Regra principal:
  Score de machos usa TCA (Taxa de Concepcao Ajustada):
  TCA = ((N x TCB) + (K x MR)) / (N + K), com K = 20.

- Excecoes:
  Sem coberturas historicas, media do rebanho assume valor default no calculo.

- Erros esperados:
  Sem erro para N baixo; confiabilidade e score refletem baixa evidencia.

- Criterio de aceite:
  Endpoint de recomendacoes de machos retorna ranking com TCB, TCA, confiabilidade e motivos.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/cobertura/utils/calcular-ivr.util.ts
  src/modules/reproducao/cobertura/utils/reproducao-queries-drizzle.util.ts
  src/modules/reproducao/cobertura/dto/recomendacao-acasalamento.dto.ts

- Status:
  implementada

## REPRO-COB-009 - Ownership por usuario nao e aplicado de forma explicita na camada de cobertura

- Contexto de negocio:
  Regras multi-tenant exigem validar se o usuario autenticado tem vinculo com a propriedade informada no payload.

- Regra principal:
  Operacoes de cobertura deveriam validar ownership por id_usuario + idPropriedade antes de CRUD.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, o fluxo pode aceitar idPropriedade sem validacao explicita de vinculo do usuario na camada de cobertura.

- Criterio de aceite:
  Metodo create recebe auth_uuid, porem nao usa esse parametro nas validacoes/repositorio.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.controller.ts
  src/modules/reproducao/cobertura/cobertura.service.ts

- Status:
  parcial
