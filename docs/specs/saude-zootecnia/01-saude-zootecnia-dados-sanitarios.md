# SAUDE-ZOOTECNIA - Dados Sanitarios

## SZO-SAN-001 - Registro sanitario valida medicacao e usuario interno antes de persistir

- Contexto de negocio:
  Historico de tratamento precisa vinculo consistente com medicacao e usuario responsavel.

- Regra principal:
  Create deve validar existencia de medicacao, resolver usuario interno a partir do auth_uuid e inserir registro sanitario.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  BadRequestException para medicacao inexistente.

- Criterio de aceite:
  Service chama findMedicacaoById, UserHelper.getInternalUserId e repository.create no fluxo de create.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/saude-zootecnia/dados-sanitarios/repositories/dados-sanitarios.repository.drizzle.ts
  src/core/utils/user.helper.ts

- Status:
  implementada

## SZO-SAN-002 - Doenca e normalizada automaticamente no create/update

- Contexto de negocio:
  Variacoes de grafia e erros de digitacao prejudicam consolidacao de historico clinico e analises.

- Regra principal:
  Doenca deve passar por normalizacao (lowercase, remocao de acento e similaridade com dicionario conhecido) antes de persistir.

- Excecoes:
  Se nao houver doenca no payload, normalizacao nao e aplicada.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Service aplica DoencaNormalizerUtil.normalize em create e update, com limiar de similaridade definido.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/saude-zootecnia/dados-sanitarios/utils/doenca-normalizer.utils.ts

- Status:
  implementada

## SZO-SAN-003 - Doencas graves disparam alerta clinico automatico

- Contexto de negocio:
  Diagnosticos de alta criticidade exigem acao rapida e visibilidade operacional.

- Regra principal:
  Ao registrar doenca grave, sistema deve tentar criar alerta clinico de alta prioridade com contexto do animal/propriedade.

- Excecoes:
  Falha na criacao do alerta nao bloqueia a persistencia do registro sanitario.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Service consulta lista de doencas graves e chama alertasService.createIfNotExists em caso positivo.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/alerta/alerta.service.ts

- Status:
  implementada

## SZO-SAN-004 - Frequencia de doencas suporta agregacao por similaridade

- Contexto de negocio:
  Relatorios de incidencia precisam consolidar doencas equivalentes mesmo com pequenas variacoes de nome.

- Regra principal:
  Endpoint de frequencia deve retornar contagem por doenca normalizada e pode agrupar termos similares por limiar configuravel.

- Excecoes:
  Quando agrupamento estiver desativado, retorna frequencia direta por termo normalizado.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  getFrequenciaDoencas aplica StringSimilarityUtil.groupSimilarStrings quando agruparSimilares=true.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.controller.ts
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/core/utils/string-similarity.utils.ts

- Status:
  implementada

## SZO-SAN-005 - Restore usa busca que ignora registros removidos

- Contexto de negocio:
  Restauracao de soft delete precisa localizar o registro inclusive quando estiver removido.

- Regra principal:
  Fluxo de restore deveria usar busca que inclua removidos antes de validar estado deletedAt.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, restore pode retornar not found porque findById filtra deletedAt nulo.

- Criterio de aceite:
  Service.restore chama repository.findById, e repository.findById consulta somente registros ativos.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/saude-zootecnia/dados-sanitarios/repositories/dados-sanitarios.repository.drizzle.ts

- Status:
  parcial

## SZO-SAN-006 - Ownership por propriedade nao usa helper central de autorizacao

- Contexto de negocio:
  Endpoints por propriedade devem respeitar escopo de acesso do usuario autenticado.

- Regra principal:
  Leitura por propriedade deveria validar ownership/vinculo do usuario com helper central antes da consulta.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, findByPropriedade executa consulta por id_propriedade sem validacao explicita de escopo de usuario.

- Criterio de aceite:
  Service/controller nao usam AuthHelperService/PropertyExistsGuard no fluxo por propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.controller.ts
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/core/services/auth-helper.service.ts
  src/core/guards/property-exists.guard.ts

- Status:
  parcial
