# CORE - Validators

## CORE-VAL-001 - Data nao pode estar no futuro

- Contexto de negocio:
  Varios eventos de dominio exigem consistencia temporal minima.

- Regra principal:
  Validator IsNotFutureDate deve rejeitar datas futuras.

- Excecoes:
  Campo vazio pode ser aceito quando combinado com IsOptional.

- Erros esperados:
  Mensagem de validacao indicando data futura invalida.

- Criterio de aceite:
  Data posterior ao dia atual e rejeitada pela validacao.

- Rastreabilidade para codigo e testes:
  src/core/validators/date.validators.ts

- Status:
  implementada

## CORE-VAL-002 - Regras de idade minima e maxima reutilizaveis

- Contexto de negocio:
  Regras etarias variam por contexto (cadastro, reproducao, etc), mas precisam de mecanismo comum.

- Regra principal:
  Validators MaxAge e MinAge devem validar idade por parametros configuraveis.

- Excecoes:
  Campo vazio pode ser tratado por optionalidade externa.

- Erros esperados:
  Mensagens explicitas de limite minimo/maximo de idade.

- Criterio de aceite:
  Decorators de idade aceitam threshold por argumento e aplicam no DTO.

- Rastreabilidade para codigo e testes:
  src/core/validators/date.validators.ts

- Status:
  implementada

## CORE-VAL-003 - Validacao de relacao entre datas

- Contexto de negocio:
  Fluxos com janelas temporais precisam de ordem e intervalo coerentes.

- Regra principal:
  Validators IsAfterDate, MaxDateInterval e MinDateInterval devem validar relacao entre campos de data.

- Excecoes:
  Se data inicial nao estiver presente, validator nao falha por dependencia ausente.

- Erros esperados:
  Mensagem de intervalo invalido (maior que maximo ou menor que minimo).

- Criterio de aceite:
  DTO com data final fora da janela especificada e rejeitado na validacao.

- Rastreabilidade para codigo e testes:
  src/core/validators/date.validators.ts

- Status:
  implementada

## CORE-VAL-004 - Mensagens de validacao centralizadas

- Contexto de negocio:
  Mensagens inconsistentes geram UX ruim e maior custo de manutencao.

- Regra principal:
  Mensagens padrao devem ser centralizadas em objeto unico reutilizavel.

- Excecoes:
  Modulos podem criar mensagens especificas quando houver necessidade de dominio.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Catalogo de mensagens cobre tipos, datas, UUID, tamanho, limites e enums.

- Rastreabilidade para codigo e testes:
  src/core/validators/validation-messages.ts

- Status:
  implementada
