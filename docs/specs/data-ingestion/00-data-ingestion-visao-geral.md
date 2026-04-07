# DATA-INGESTION - Visao Geral

## DING-ARCH-001 - Modulo organiza ingestao por dominio com componentes dedicados

- Contexto de negocio:
  A importacao operacional precisa separar responsabilidades entre validacao, orquestracao, comunicacao ETL e manutencao agendada.

- Regra principal:
  DataIngestionModule deve registrar service central, client ETL, validator, mapper, pipelines por dominio e job de limpeza.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando provider do modulo nao estiver registrado.

- Criterio de aceite:
  Providers incluem DataIngestionService, ETL_CLIENT, DataIngestionValidator, DataIngestionMapper, LeitePipeline, PesagemPipeline, ReproducaoPipeline e ScheduledIngestionJob.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/data-ingestion.module.ts

- Status:
  implementada

## DING-ARCH-002 - Modulo faz parte do bootstrap principal da API

- Contexto de negocio:
  Ingestao deve estar disponivel como capacidade nativa da aplicacao.

- Regra principal:
  AppModule deve importar DataIngestionModule para expor os endpoints e jobs do dominio.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem import no AppModule, endpoints nao sao registrados.

- Criterio de aceite:
  DataIngestionModule aparece no array imports do AppModule.

- Rastreabilidade para codigo e testes:
  src/app.module.ts

- Status:
  implementada

## DING-ARCH-003 - API expoe tres fluxos de importacao por propriedade

- Contexto de negocio:
  O negocio importa planilhas distintas para leite, pesagem e reproducao.

- Regra principal:
  Controller deve expor POST para leite, pesagem e reproducao no escopo de propriedade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  422 para arquivo invalido e 429 para limite excedido.

- Criterio de aceite:
  Endpoints POST /leite, /pesagem e /reproducao existem na rota base de data-ingestion por propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts

- Status:
  implementada

## DING-ARCH-004 - API expoe tres fluxos de exportacao em XLSX

- Contexto de negocio:
  Operacao de campo precisa baixar planilhas filtradas por dominio de negocio.

- Regra principal:
  Controller deve expor GET de exportacao para leite, pesagem e reproducao, retornando arquivo XLSX em resposta binaria.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  503 quando servico ETL estiver indisponivel.

- Criterio de aceite:
  Endpoints GET /leite/export, /pesagem/export e /reproducao/export definem headers de download de planilha.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts

- Status:
  implementada

## DING-ARCH-005 - Controle de acesso por propriedade e aplicado antes de processar ETL

- Contexto de negocio:
  Em ambiente multi-tenant, importacoes e exportacoes devem respeitar escopo de propriedade do usuario.

- Regra principal:
  Pipelines devem validar acesso do usuario a propriedade antes de chamar o cliente ETL.

- Excecoes:
  Sem excecoes para import/export.

- Erros esperados:
  403 quando usuario nao possui acesso a propriedade.

- Criterio de aceite:
  Fluxos chamam DataIngestionValidator.validatePropriedadeAccess com userId e propriedadeId.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## DING-ARCH-006 - Consulta de status de job nao valida ownership da propriedade

- Contexto de negocio:
  Status de processamento deveria respeitar isolamento por tenant quando o identificador de job for compartilhado.

- Regra principal:
  Endpoint de job deveria validar escopo do usuario sobre o job consultado.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, usuario autenticado pode consultar status de job apenas com jobId, sem validacao explicita de propriedade.

- Criterio de aceite:
  DataIngestionJobController usa apenas jobId em rota global e DataIngestionService.getJobStatus nao recebe contexto de usuario/propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts

- Status:
  parcial

## DING-ARCH-007 - RolesGuard esta aplicado sem regra de cargo no controller principal

- Contexto de negocio:
  Guard de cargo so gera efeito quando a rota declara roles permitidas.

- Regra principal:
  Endpoints de data-ingestion deveriam explicitar politica de cargo caso o filtro por role seja requisito.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, RolesGuard nao bloqueia por cargo porque nao ha metadata de roles nos endpoints do modulo.

- Criterio de aceite:
  Controller usa @UseGuards(SupabaseAuthGuard, RolesGuard), mas nao usa decorator @Roles em classe/metodos.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/auth/guards/roles.guard.ts

- Status:
  parcial

## DING-ARCH-008 - Nao ha cobertura automatizada dedicada para o modulo

- Contexto de negocio:
  Regras de validacao de arquivo, rate limit e integracao ETL devem ter regressao automatizada.

- Regra principal:
  O modulo deveria possuir testes unitarios/e2e proprios para pipelines, validator e controller.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Maior risco de regressao silenciosa em import/export e seguranca de acesso.

- Criterio de aceite:
  Nao existem arquivos .spec.ts em src/modules/data-ingestion nem suites e2e dedicadas encontradas.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion
  test/

- Status:
  parcial
