# REPRODUCAO - Visao Geral

## REPRO-ARCH-001 - Modulo compoe quatro subdominios de reproducao

- Contexto de negocio:
  O dominio reprodutivo exige separar operacao de cobertura, genealogia, estoque genetico e simulacao.

- Regra principal:
  ReproducaoModule deve compor CoberturaModule, MaterialGeneticoModule, GenealogiaModule e SimulacaoModule.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI se algum submodulo nao estiver registrado.

- Criterio de aceite:
  Modulo raiz importa os quatro submodulos citados.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/reproducao.module.ts

- Status:
  implementada

## REPRO-ARCH-002 - Endpoints do dominio exigem autenticacao JWT

- Contexto de negocio:
  Dados de reproducao e genealogia nao podem ser expostos anonimamente.

- Regra principal:
  Controllers de cobertura, material genetico, genealogia e simulacao devem aplicar SupabaseAuthGuard.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token ausente, invalido ou expirado.

- Criterio de aceite:
  Todos os controllers do modulo estao anotados com @UseGuards(SupabaseAuthGuard).

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/cobertura/cobertura.controller.ts
  src/modules/reproducao/material-genetico/material-genetico.controller.ts
  src/modules/reproducao/genealogia/genealogia.controller.ts
  src/modules/reproducao/simulacao/simulacao.controller.ts
  src/modules/auth/guards/auth.guard.ts

- Status:
  implementada

## REPRO-ARCH-003 - Fluxos de IA dependem de servico externo configurado

- Contexto de negocio:
  Analise genealogica, simulacao e recomendacoes dependem de API externa de IA para calculo genetico.

- Regra principal:
  SimulacaoService e GenealogiaIAService devem chamar IA_API_URL e tratar indisponibilidade/timeout.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  - Erro de inicializacao se IA_API_URL nao estiver configurada no SimulacaoService.
  - Simulacao: NotFoundException (404), BadRequestException (400), UnprocessableEntityException (422), HttpException (demais status 4xx/5xx), ServiceUnavailableException (indisponibilidade) e RequestTimeoutException (timeout).
  - Genealogia IA: HttpException para status retornado pela IA, ServiceUnavailableException para indisponibilidade e RequestTimeoutException para timeout.

- Criterio de aceite:
  Servicos fazem chamadas HTTP para endpoints de IA, com timeout e tratamento semantico de erro por status.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts
  src/modules/reproducao/genealogia/genealogia-ia.service.ts

- Status:
  implementada

## REPRO-ARCH-004 - Validacao de ownership e aplicada de forma uniforme nos subdominios

- Contexto de negocio:
  Em ambiente multi-tenant, operacoes por propriedade precisam validar vinculo entre usuario e propriedade alvo.

- Regra principal:
  Ownership e validado de forma explicita nos subdominios de cobertura, material genetico e genealogia.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para registro sem propriedade vinculada e erro de acesso quando usuario nao possui vinculo com a propriedade.

- Criterio de aceite:
  - CoberturaController e MaterialGeneticoController propagam @User para os fluxos protegidos.
  - CoberturaService e MaterialGeneticoService usam AuthHelperService (getUserId, validatePropriedadeAccess, getUserPropriedades) para validar/filtrar operacoes.
  - GenealogiaService mantem validacao de ownership antes de responder arvore/analise.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.service.ts
  src/modules/reproducao/cobertura/cobertura.controller.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/material-genetico/material-genetico.controller.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/modules/reproducao/cobertura/cobertura.service.spec.ts
  src/modules/reproducao/material-genetico/material-genetico.service.spec.ts
  src/core/services/user-mapping.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  implementada
