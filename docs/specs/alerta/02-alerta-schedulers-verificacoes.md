# ALERTA - Schedulers e Verificacoes

## ALERTA-SCH-001 - Scheduler executa oito jobs diarios com horarios fixos

- Contexto de negocio:
  Regras preventivas precisam rodar de forma previsivel para nao perder janela operacional.

- Regra principal:
  AlertasScheduler deve agendar jobs nos horarios 00:00, 00:05, 01:00, 02:00, 03:00, 04:00, 05:00 e 06:00.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Metodos anotados com @Cron usam expressoes correspondentes aos horarios definidos.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.scheduler.ts

- Status:
  implementada

## ALERTA-SCH-002 - Cada job percorre propriedades ativas antes de aplicar regras

- Contexto de negocio:
  A criacao de alerta deve respeitar isolamento por propriedade.

- Regra principal:
  executarJobPorPropriedade deve buscar propriedades sem deletedAt e executar callback por id_propriedade.

- Excecoes:
  Sem propriedades ativas resulta em total zero sem falha.

- Erros esperados:
  Erro de uma propriedade e logado sem interromper as demais.

- Criterio de aceite:
  getPropriedadesAtivas usa query na tabela propriedade e o job soma alertas criados por propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.scheduler.ts
  src/database/schema.ts

- Status:
  implementada

## ALERTA-SCH-003 - Nicho SANITARIO gera alertas para retorno de tratamento e vacinacao

- Contexto de negocio:
  Agenda sanitaria precisa aviso antecipado para reavaliacao clinica e preparo de imunobiologicos.

- Regra principal:
  Verificacao sanitaria deve criar alerta para tratamentos com retorno ate 15 dias e vacinacoes ate 30 dias.

- Excecoes:
  Se propriedade nao tiver bufalos, nao cria alerta.

- Erros esperados:
  Falhas por tratamento/vacinacao individual sao logadas e nao interrompem o lote.

- Criterio de aceite:
  AlertaSanitarioService consulta repositorio sanitario com ANTECEDENCIA_SANITARIO_DIAS e ANTECEDENCIA_VACINACAO_DIAS.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-sanitario.service.ts
  src/modules/alerta/repositories/sanitario.repository.drizzle.ts
  src/modules/alerta/utils/alerta.constants.ts

- Status:
  implementada

## ALERTA-SCH-004 - Nicho REPRODUCAO alerta partos previstos na janela de 30 dias

- Contexto de negocio:
  Equipe precisa preparar maternidade antes do parto previsto.

- Regra principal:
  Para gestacoes confirmadas, data prevista = dtEvento + 315 dias; alerta e criado quando faltam de 1 a 30 dias.

- Excecoes:
  Gestacoes sem dtEvento sao ignoradas.

- Erros esperados:
  Falhas por reproducao individual sao logadas sem abortar a verificacao.

- Criterio de aceite:
  AlertaReproducaoService aplica TEMPO_GESTACAO_DIAS e ANTECEDENCIA_PARTO_DIAS antes de criar alerta.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-reproducao.service.ts
  src/modules/alerta/repositories/reproducao.repository.drizzle.ts
  src/modules/alerta/utils/alerta.constants.ts

- Status:
  implementada

## ALERTA-SCH-005 - Nicho REPRODUCAO monitora coberturas sem diagnostico apos 90 dias

- Contexto de negocio:
  Coberturas sem confirmacao por longo periodo comprometem taxa de prenhez e planejamento reprodutivo.

- Regra principal:
  Cobertura sem diagnostico por 90+ dias deve gerar alerta recorrente.

- Excecoes:
  Sem coberturas candidatas, o job encerra com zero alertas.

- Erros esperados:
  Falhas por item sao logadas.

- Criterio de aceite:
  Service usa DIAS_SEM_DIAGNOSTICO_COBERTURA e cria alerta com tipo_evento_origem COBERTURA_SEM_DIAGNOSTICO.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-reproducao.service.ts
  src/modules/alerta/utils/alerta.constants.ts

- Status:
  implementada

## ALERTA-SCH-006 - Nicho REPRODUCAO sinaliza femeas vazias aptas ha 180+ dias

- Contexto de negocio:
  Femeas em idade reprodutiva sem cobertura representam perda de eficiencia reprodutiva.

- Regra principal:
  Femeas com idade minima de 18 meses devem gerar alerta quando sem cobertura por 180+ dias ou quando nunca cobertas.

- Excecoes:
  Ultima cobertura com status Confirmada retorna zero dias (gestante) e nao gera alerta.

- Erros esperados:
  Falha individual e logada.

- Criterio de aceite:
  Service combina IDADE_MINIMA_REPRODUCAO_MESES e DIAS_SEM_COBERTURA_FEMEA_VAZIA, tratando ausencia de cobertura como Infinity.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-reproducao.service.ts
  src/modules/alerta/repositories/reproducao.repository.drizzle.ts
  src/modules/alerta/repositories/bufalo.repository.drizzle.ts

- Status:
  implementada

## ALERTA-SCH-007 - Nicho PRODUCAO detecta queda percentual comparando janela recente vs historica

- Contexto de negocio:
  Queda de leite pode indicar problema sanitario, nutricional ou de manejo.

- Regra principal:
  O sistema compara media dos ultimos 7 dias com media dos 30 dias anteriores e alerta quando queda >= 20%.

- Excecoes:
  Sem registros minimos (3 recentes e 10 historicos), a analise do animal e descartada.

- Erros esperados:
  Falhas por bufala sao logadas sem interromper lote.

- Criterio de aceite:
  AlertaProducaoService agrupa por bufala, calcula medias e aplica QUEDA_PRODUCAO_PERCENTUAL_MINIMO.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-producao.service.ts
  src/modules/alerta/repositories/producao.repository.drizzle.ts
  src/modules/alerta/utils/alerta.constants.ts

- Status:
  implementada

## ALERTA-SCH-008 - Nicho MANEJO identifica secagem pendente em gestantes ainda em ordenha

- Contexto de negocio:
  Secagem pre-parto protege saude mamaria e prepara proxima lactacao.

- Regra principal:
  Se faltarem ate 60 dias para parto previsto e houver ordenha recente (ultimos 7 dias), deve gerar alerta de secagem pendente.

- Excecoes:
  Gestante sem ordenha recente nao gera alerta.

- Erros esperados:
  Falhas por reproducao sao logadas sem abortar lote.

- Criterio de aceite:
  AlertaManejoService cruza gestacao confirmada com buscarOrdenhasRecentes(..., 7 dias).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-manejo.service.ts
  src/modules/alerta/repositories/reproducao.repository.drizzle.ts
  src/modules/alerta/repositories/producao.repository.drizzle.ts
  src/modules/alerta/utils/alerta.constants.ts

- Status:
  implementada

## ALERTA-SCH-009 - Nicho CLINICO combina tratamentos multiplos e ganho de peso insuficiente

- Contexto de negocio:
  Sinais precoces permitem intervencao veterinaria antes da agravacao clinica.

- Regra principal:
  Para cada propriedade, criar alerta quando animal tiver 3+ tratamentos no periodo ou ganho < 5kg em 60 dias (com minimo de 2 pesagens).

- Excecoes:
  Sem id_propriedade, o servico retorna zero por seguranca operacional.

- Erros esperados:
  Falhas por animal sao logadas sem parar o processamento.

- Criterio de aceite:
  AlertaClinicoService usa TRATAMENTOS_MULTIPLOS_THRESHOLD, GANHO_PESO_MINIMO_60_DIAS e MIN_PESAGENS_ANALISE.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-clinico.service.ts
  src/modules/alerta/repositories/sanitario.repository.drizzle.ts
  src/modules/alerta/repositories/bufalo.repository.drizzle.ts
  src/modules/alerta/utils/alerta.constants.ts

- Status:
  implementada

## ALERTA-SCH-010 - Verificacao manual permite selecionar nichos e agrega resultados por dominio

- Contexto de negocio:
  O operador pode precisar reprocessar alertas de uma propriedade sem esperar o horario do cron.

- Regra principal:
  AlertasVerificacaoService deve executar apenas os nichos solicitados (ou todos por padrao) e retornar total + detalhes por nicho.

- Excecoes:
  Falha de um nicho nao bloqueia os demais; detalhes do nicho falho retornam erro no payload.

- Erros esperados:
  Falhas por nicho sao encapsuladas em detalhes[nicho].erro.

- Criterio de aceite:
  Implementacao usa Promise.allSettled e soma totais apenas de execucoes fulfilled.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alertas-verificacao.service.ts
  src/modules/alerta/alerta.controller.ts

- Status:
  implementada

## ALERTA-SCH-011 - Calculo de prioridade por gravidade existe, mas nao e persistido em dois nichos

- Contexto de negocio:
  A gravidade da queda de producao e da janela de secagem deveria influenciar prioridade final do alerta.

- Regra principal:
  Alertas de producao e manejo deveriam persistir prioridade calculada (ALTA/MEDIA) no DTO de criacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, a prioridade calculada localmente pode ser ignorada, deixando o alerta dependente de classificacao assincrona por IA.

- Criterio de aceite:
  AlertaProducaoService e AlertaManejoService calculam variavel prioridade, porem nao a enviam em CreateAlertaDto.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/services/alerta-producao.service.ts
  src/modules/alerta/services/alerta-manejo.service.ts

- Status:
  parcial
