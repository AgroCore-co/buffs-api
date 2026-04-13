# REBANHO - DTOs e Validacoes

## REB-DTO-001 - CreateBufaloDto valida identidade, sexo e limites zootecnicos

- Contexto de negocio:
  Cadastro de animal exige consistencia minima para evitar registros inviaveis no rebanho.

- Regra principal:
  DTO de criacao deve validar campos obrigatorios, UUIDs relacionais, sexo enum e limites de data/idade.

- Excecoes:
  Alguns campos genealogicos e de registro sao opcionais.

- Erros esperados:
  400 para payload invalido (sexo fora do enum, UUID invalido, data futura, idade acima do limite etc.).

- Criterio de aceite:
  CreateBufaloDto aplica class-validator e validators customizados de data do Core.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/dto/create-bufalo.dto.ts
  src/core/validators/date.validators.ts
  test/rebanho.e2e-spec.ts

- Status:
  implementada

## REB-DTO-002 - Filtro avancado de bufalo suporta conversao robusta de status

- Contexto de negocio:
  Filtros via query string exigem conversao segura de string para boolean e limites de paginacao.

- Regra principal:
  DTO de filtro avancado deve aceitar combinacoes de filtros e converter status para boolean com decorator compartilhado.

- Excecoes:
  Filtros sao opcionais e podem ser usados isoladamente.

- Erros esperados:
  400 para parametros fora de faixa (page/limit) ou enum invalido.

- Criterio de aceite:
  FiltroAvancadoBufaloDto usa ToBoolean, validacoes de enum e limites de pagina.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/dto/filtro-avancado-bufalo.dto.ts
  src/core/decorators/to-boolean.decorator.ts

- Status:
  implementada

## REB-DTO-003 - DTO de inativacao exige data de baixa e motivo obrigatorios

- Contexto de negocio:
  Baixa formal de animal precisa rastreabilidade clara para auditoria.

- Regra principal:
  DTO de inativacao deve exigir data valida (nao futura) e motivo textual com limite de tamanho.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para data invalida/futura ou motivo ausente.

- Criterio de aceite:
  InativarBufaloDto aplica IsNotFutureDate, IsDate e validacao de texto obrigatoria.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/dto/inativar-bufalo.dto.ts
  src/core/validators/date.validators.ts

- Status:
  implementada

## REB-DTO-004 - DTOs de grupo e raca padronizam identidade e limites

- Contexto de negocio:
  Cadastros auxiliares de grupo e raca precisam contrato simples e previsivel.

- Regra principal:
  DTOs devem validar nome obrigatorio e, no caso de grupo, idPropriedade UUID obrigatorio.

- Excecoes:
  Cor do grupo e opcional.

- Erros esperados:
  400 para nome vazio, UUID invalido ou tamanho acima do permitido.

- Criterio de aceite:
  CreateGrupoDto e CreateRacaDto aplicam validacoes declarativas de class-validator.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/grupo/dto/create-grupo.dto.ts
  src/modules/rebanho/raca/dto/create-raca.dto.ts

- Status:
  implementada

## REB-DTO-005 - DTO de movimentacao valida referencias e datas ISO

- Contexto de negocio:
  Movimentacao entre lotes depende de IDs consistentes e linha do tempo valida.

- Regra principal:
  CreateMovLoteDto deve exigir UUIDs principais e data de entrada em formato ISO; UpdateMovLoteDto deve permitir alteracao parcial segura.

- Excecoes:
  idLoteAnterior e opcional (pode ser auto-detectado).

- Erros esperados:
  400 para UUID/data invalidos.

- Criterio de aceite:
  CreateMovLoteDto usa validacoes de UUID/IsDateString e UpdateMovLoteDto deriva de PartialType.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/mov-lote/dto/create-mov-lote.dto.ts
  src/modules/rebanho/mov-lote/dto/update-mov-lote.dto.ts

- Status:
  implementada

## REB-TEST-001 - Cobertura automatizada do dominio esta concentrada em bufalos

- Contexto de negocio:
  Modulo de maior risco funcional (bufalo) deve ter validacao automatizada de regras centrais.

- Regra principal:
  Projeto possui testes unitarios e e2e para bufalo (service, scheduler, maturidade e fluxos HTTP principais).

- Excecoes:
  Parte dos cenarios e2e esta marcada como skip por restricoes operacionais (ex.: rate limit no ambiente de auth).

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existem arquivos de teste dedicados em bufalo e suite e2e de rebanho com cenarios reais.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/bufalo/bufalo.service.spec.ts
  src/modules/rebanho/bufalo/bufalo.scheduler.spec.ts
  src/modules/rebanho/bufalo/services/bufalo-maturidade.service.spec.ts
  test/rebanho.e2e-spec.ts

- Status:
  implementada

## REB-TEST-002 - Grupos, racas e mov-lote possuem suites dedicadas de service

- Contexto de negocio:
  Regras de agrupamento, catalogo e historico de movimentacao tambem sofrem regressao e precisam cobertura especifica.

- Regra principal:
  Modulo deve manter testes dedicados para services de grupo, raca e mov-lote para reduzir regressao de ownership, cache e integridade de regras.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existem arquivos .spec.ts dedicados para os tres subdominios.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/grupo/
  src/modules/rebanho/raca/
  src/modules/rebanho/mov-lote/
  src/modules/rebanho/**/*.spec.ts
  src/modules/rebanho/grupo/grupo.service.spec.ts
  src/modules/rebanho/raca/raca.service.spec.ts
  src/modules/rebanho/mov-lote/mov-lote.service.spec.ts

- Status:
  implementada
