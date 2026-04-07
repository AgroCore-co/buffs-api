# CORE - Decorators

## CORE-DEC-001 - Conversao robusta de boolean em payload

- Contexto de negocio:
  Query/body podem enviar boolean como string, e conversion implicita pode gerar ambiguidades.

- Regra principal:
  Decorator de boolean deve aceitar true/false e 1/0, normalizando para boolean.

- Excecoes:
  Valores vazios (null, undefined, string vazia) retornam undefined para validacao tratar.

- Erros esperados:
  Valor nao reconhecido nao vira boolean e permanece undefined para fluxo de validacao.

- Criterio de aceite:
  Entradas true/1 viram true, false/0 viram false, entradas invalidas nao geram true/false incorreto.

- Rastreabilidade para codigo e testes:
  src/core/decorators/to-boolean.decorator.ts

- Status:
  implementada

## CORE-DEC-002 - Compatibilidade com enableImplicitConversion

- Contexto de negocio:
  Pipeline global de validacao pode converter valor antes do decorator.

- Regra principal:
  Decorator deve priorizar obj[key] quando disponivel para preservar valor bruto.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Conversao se mantem confiavel mesmo com enableImplicitConversion ativo.

- Rastreabilidade para codigo e testes:
  src/core/decorators/to-boolean.decorator.ts

- Status:
  implementada
