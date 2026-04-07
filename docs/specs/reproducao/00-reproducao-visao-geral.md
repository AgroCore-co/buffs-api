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
  - InternalServerErrorException ou Error em caso de timeout/indisponibilidade da IA.

- Criterio de aceite:
  Servicos fazem chamadas HTTP para endpoints de IA, com timeout e tratamento de erro.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/simulacao/simulacao.service.ts
  src/modules/reproducao/genealogia/genealogia-ia.service.ts

- Status:
  implementada

## REPRO-ARCH-004 - Validacao de ownership nao e uniforme em todos os subdominios

- Contexto de negocio:
  Em ambiente multi-tenant, operacoes por propriedade precisam validar vinculo entre usuario e propriedade alvo.

- Regra principal:
  Ownership deveria ser validado de forma consistente em todos os subdominios de reproducao.

- Excecoes:
  Genealogia implementa validacao explicita por dono/funcionario antes de retornar arvore e antes de chamar IA.

- Erros esperados:
  No estado atual, fluxos de cobertura e material genetico podem operar com idPropriedade valido sem validacao explicita do vinculo do usuario autenticado.

- Criterio de aceite:
  - GenealogiaService usa UserMappingService + repositorio de vinculo.
  - CoberturaService recebe auth_uuid, mas nao usa esse valor para filtrar ou validar ownership.
  - MaterialGeneticoService nao recebe contexto de usuario para validacao de ownership.

- Rastreabilidade para codigo e testes:
  src/modules/reproducao/genealogia/genealogia.service.ts
  src/modules/reproducao/cobertura/cobertura.service.ts
  src/modules/reproducao/material-genetico/material-genetico.service.ts
  src/core/services/user-mapping.service.ts
  src/modules/usuario/repositories/usuario-propriedade.repository.drizzle.ts

- Status:
  parcial
