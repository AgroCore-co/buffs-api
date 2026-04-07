# GESTAO-PROPRIEDADE - Visao Geral

## GPROP-ARCH-001 - Modulo agrega tres subdominios operacionais

- Contexto de negocio:
  Gestao de fazenda precisa separar responsabilidades entre cadastro da propriedade, endereco e lotes/piquetes.

- Regra principal:
  GestaoPropriedadeModule deve compor e exportar LoteModule, PropriedadeModule e EnderecoModule.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando um submodulo nao e importado/exportado corretamente.

- Criterio de aceite:
  Modulo raiz importa e exporta os tres submodulos.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/gestao-propriedade.module.ts

- Status:
  implementada

## GPROP-ARCH-002 - Endpoints exigem autenticacao e controle de papel

- Contexto de negocio:
  Operacoes sobre ativos de propriedade nao devem ser anonimas nem abertas para cargos sem permissao.

- Regra principal:
  Controllers do modulo devem exigir SupabaseAuthGuard e, quando aplicavel, RolesGuard com cargos definidos.

- Excecoes:
  Nem toda rota aplica RolesGuard no metodo, mas todas exigem autenticacao.

- Erros esperados:
  401 para token ausente/invalido; 403 para cargo sem permissao.

- Criterio de aceite:
  Controllers usam guards e decorators de roles nos endpoints administrativos.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.controller.ts
  src/modules/gestao-propriedade/endereco/endereco.controller.ts
  src/modules/gestao-propriedade/lote/lote.controller.ts

- Status:
  implementada

## GPROP-ARCH-003 - Isolamento por propriedade e aplicado no service layer

- Contexto de negocio:
  Usuario autenticado so pode operar entidades de propriedades que estao no seu escopo (dono ou vinculado).

- Regra principal:
  Services devem validar acesso por propriedade usando AuthHelperService antes de consultar ou alterar dados sensiveis.

- Excecoes:
  Criacao de endereco nao recebe id_propriedade no momento de criacao.

- Erros esperados:
  NotFoundException quando usuario nao possui acesso; ForbiddenException em cenarios de ownership especifico.

- Criterio de aceite:
  PropriedadeService e LoteService usam getUserId/validatePropriedadeAccess; EnderecoService usa propriedades acessiveis para filtrar leitura.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/propriedade/propriedade.service.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/lote/lote.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## GPROP-TEST-001 - Cobertura de testes dedicada do modulo

- Contexto de negocio:
  Regras de ownership, soft delete e consistencia entre propriedade/grupo tem alto risco de regressao.

- Regra principal:
  O modulo deveria ter testes unitarios/e2e proprios para propriedades, enderecos e lotes.

- Excecoes:
  Existem testes de outros modulos que criam propriedade/endereco como setup, mas nao validam regras internas do modulo de forma dedicada.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual nao foram encontrados arquivos de teste focados especificamente em gestao-propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/
  test/helpers/test-setup.ts
  test/rebanho.e2e-spec.ts

- Status:
  parcial
