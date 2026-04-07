# PRODUCAO - Predicao com IA

## PROD-IA-001 - Endpoint de predicao exige autenticacao e entrada minima

- Contexto de negocio:
  Predicao de produtividade e dado sensivel e nao deve ser executada sem identidade do usuario.

- Regra principal:
  POST /producao/predicao exige SupabaseAuthGuard e corpo com idFemea em formato UUID.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token invalido e 400 para payload invalido.

- Criterio de aceite:
  Controller protegido por guard e DTO de entrada com IsUUID.

- Rastreabilidade para codigo e testes:
  src/modules/producao/predicao-producao/predicao-producao.controller.ts
  src/modules/producao/predicao-producao/dto/predicao-producao.dto.ts
  src/modules/auth/guards/auth.guard.ts

- Status:
  implementada

## PROD-IA-002 - Integracao externa usa endpoint dedicado e propaga contexto do usuario

- Contexto de negocio:
  O modelo de predicao e externo e precisa receber contexto de usuario para autorizacao/auditoria.

- Regra principal:
  PredicaoProducaoService deve chamar IA_API_URL/predicao-individual com body { idFemea } e header x-user-id.

- Excecoes:
  Quando IA_API_URL nao estiver configurada, usa fallback local `http://localhost:8000`.

- Erros esperados:
  Erros de conectividade e resposta da IA devem ser tratados centralmente.

- Criterio de aceite:
  Metodo predizerProducaoIndividual monta URL, injeta header x-user-id e envia chamada HTTP.

- Rastreabilidade para codigo e testes:
  src/modules/producao/predicao-producao/predicao-producao.service.ts

- Status:
  implementada

## PROD-IA-003 - Predicao aplica timeout defensivo de 30 segundos

- Contexto de negocio:
  Chamadas de IA nao podem bloquear indefinidamente o fluxo HTTP da API principal.

- Regra principal:
  A integracao deve encerrar requisicao apos 30000ms usando timeout do axios e operador timeout do RxJS.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  TimeoutError quando tempo maximo e excedido.

- Criterio de aceite:
  requestTimeout e configurado como 30000 e aplicado no post + pipe(timeout()).

- Rastreabilidade para codigo e testes:
  src/modules/producao/predicao-producao/predicao-producao.service.ts

- Status:
  implementada

## PROD-IA-004 - Tratamento de erros da IA nao usa HttpException tipada

- Contexto de negocio:
  Erros de integracao deveriam retornar codigos HTTP consistentes para observabilidade e contrato de API.

- Regra principal:
  handleIAError atualmente converte falhas para Error generico em vez de HttpException especifica.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Camadas superiores recebem erro generico, com menor granularidade de status de dominio.

- Criterio de aceite:
  O metodo de erro usa throw new Error(...) para cenarios de resposta HTTP, indisponibilidade e timeout.

- Rastreabilidade para codigo e testes:
  src/modules/producao/predicao-producao/predicao-producao.service.ts

- Status:
  parcial

## PROD-IA-005 - Cache HTTP do endpoint e aplicado sem chave de escopo de negocio explicita

- Contexto de negocio:
  Predicao depende de contexto do usuario e de estado da propriedade; cache sem estrategia clara pode gerar incoerencia temporal.

- Regra principal:
  Controller usa CacheInterceptor com TTL de 10 minutos para POST /producao/predicao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem chave customizada por tenant/animal no controller, a estrategia de cache fica dependente do mecanismo padrao do interceptor.

- Criterio de aceite:
  Endpoint possui @UseInterceptors(CacheInterceptor) no controller e @CacheTTL(600) na rota.

- Rastreabilidade para codigo e testes:
  src/modules/producao/predicao-producao/predicao-producao.controller.ts
  src/modules/producao/predicao-producao/predicao-producao.module.ts

- Status:
  parcial
