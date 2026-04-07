# GESTAO-PROPRIEDADE - Integracao com Core

## GPROP-CORE-001 - Uso de helper central de autenticacao/autorizacao

- Contexto de negocio:
  Regras de ownership por propriedade devem ser consistentes entre modulos.

- Regra principal:
  Services do modulo devem usar AuthHelperService para resolver usuario interno e validar acesso a propriedade.

- Excecoes:
  Criacao de endereco nao recebe id_propriedade no payload.

- Erros esperados:
  NotFoundException quando perfil nao existe ou usuario nao tem propriedades/acesso.

- Criterio de aceite:
  Modulo usa getUserId, getUserPropriedades e validatePropriedadeAccess nos fluxos de negocio.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## GPROP-CORE-002 - LoggerService do Core e usado no service layer

- Contexto de negocio:
  Fluxos de propriedade precisam trilha de erro para diagnostico operacional.

- Regra principal:
  Services e repositorios criticos devem registrar erros via LoggerService.

- Excecoes:
  Alguns repositorios do modulo nao injetam logger explicitamente.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  PropriedadeService, EnderecoService, LoteService e PropriedadeRepository usam LoggerService; EnderecoRepository e LoteRepository nao usam logger do Core.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/modules/gestao-propriedade/propriedade/repositories/propriedade.repository.drizzle.ts
  src/modules/gestao-propriedade/endereco/repositories/endereco.repository.drizzle.ts
  src/modules/gestao-propriedade/lote/repositories/lote.repository.drizzle.ts

- Status:
  parcial

## GPROP-CORE-003 - Utils de formatacao de data do Core sao padrao de resposta

- Contexto de negocio:
  Contrato de resposta deve manter formato consistente entre modulos.

- Regra principal:
  Retornos do modulo devem usar formatDateFields/formatDateFieldsArray para padronizar datas expostas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Services de propriedade, endereco e lote aplicam utilitarios de data do Core nas respostas.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/core/utils/date-formatter.utils.ts

- Status:
  implementada

## GPROP-CORE-004 - Cache de leitura e aplicado parcialmente no modulo

- Contexto de negocio:
  Endpoints de leitura de alta frequencia podem se beneficiar de TTL para reduzir carga.

- Regra principal:
  PropriedadeController e EnderecoController usam CacheInterceptor/CacheTTL em GETs; LoteController nao aplica cache.

- Excecoes:
  Ausencia de cache em lote pode ser opcao de projeto devido dinamica geoespacial, mas nao esta explicitada.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existem decorators de cache em propriedade/endereco, mas nao ha estrategia uniforme para o modulo inteiro.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.controller.ts
  src/modules/gestao-propriedade/endereco/endereco.controller.ts
  src/modules/gestao-propriedade/lote/lote.controller.ts

- Status:
  parcial

## GPROP-CORE-005 - Invalidação de cache de propriedades do helper nao e chamada apos escritas

- Contexto de negocio:
  AuthHelperService cacheia propriedades por usuario; mudancas de ownership/vinculo devem refletir imediatamente.

- Regra principal:
  Operacoes de create/update/delete de propriedade e lotes/enderecos dependentes deveriam considerar invalidacao de cache de propriedades quando alteram escopo de acesso.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual, modulo nao chama authHelper.invalidarCachePropriedades apos escritas relevantes.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/lote/lote.service.ts

- Status:
  parcial

## GPROP-CORE-006 - Reuso de DTOs/decorators/validators do Core e limitado

- Contexto de negocio:
  Core possui artefatos compartilhados que podem reduzir divergencia de contrato e validacao.

- Regra principal:
  Modulo usa fortemente DTOs proprios e class-validator padrao, com pouco ou nenhum reuso de DTO de paginacao, decorator to-boolean e validators customizados de data do Core.

- Excecoes:
  O uso de artefatos proprios pode ser intencional quando o dominio nao exige os contratos compartilhados.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao foram encontrados no modulo usos de PaginationDto, decorators de core/decorators nem validators de core/validators.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/
  src/core/dto/pagination.dto.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts

- Status:
  parcial
