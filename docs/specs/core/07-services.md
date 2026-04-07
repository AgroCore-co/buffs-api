# CORE - Services Compartilhados

## CORE-SVC-001 - Resolucao de usuario interno a partir do token

- Contexto de negocio:
  Regras de dominio usam id interno local e nao apenas identidade externa de autenticacao.

- Regra principal:
  Fluxos autenticados devem resolver usuario interno a partir do email/auth id antes de operar dados de negocio.

- Excecoes:
  Sem excecoes nos fluxos protegidos.

- Erros esperados:
  NotFoundException ou UnauthorizedException quando nao houver vinculo local.

- Criterio de aceite:
  Chamada sem perfil local nao segue para regras de dominio.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/core/services/user-mapping.service.ts

- Status:
  implementada

## CORE-SVC-002 - Propriedades do usuario via cache-aside

- Contexto de negocio:
  Validacao de acesso a propriedade precisa ser frequente e eficiente.

- Regra principal:
  Busca de propriedades do usuario deve usar cache-aside e combinar propriedades como dono e funcionario.

- Excecoes:
  Sem excecoes funcionais.

- Erros esperados:
  NotFoundException quando usuario nao tiver propriedade vinculada.

- Criterio de aceite:
  Primeira consulta busca no banco, consultas subsequentes usam cache ate expirar/invalidar.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/core/cache/cache.constants.ts

- Status:
  implementada

## CORE-SVC-003 - Validacao obrigatoria de acesso por propriedade

- Contexto de negocio:
  Isolamento de dados por propriedade e requisito de seguranca do dominio.

- Regra principal:
  Operacoes por propriedade devem validar membership do usuario antes de consultar ou alterar dados.

- Excecoes:
  Sem excecoes para endpoints protegidos.

- Erros esperados:
  NotFoundException quando usuario nao possui acesso a propriedade alvo.

- Criterio de aceite:
  Requisicao com propriedade sem vinculo e bloqueada antes da operacao principal.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/modules/rebanho/bufalo/bufalo.service.ts

- Status:
  implementada

## CORE-SVC-004 - Invalidacao de cache apos mudanca de vinculo

- Contexto de negocio:
  Mudancas de permissao precisam refletir rapidamente para evitar autorizacao stale.

- Regra principal:
  Fluxos que alteram vinculos de propriedade devem invalidar cache de propriedades do usuario.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Nao aplicavel como erro direto de dominio.

- Criterio de aceite:
  Apos invalidacao, proxima consulta de propriedades recarrega dados do banco.

- Rastreabilidade para codigo e testes:
  src/core/services/auth-helper.service.ts

- Status:
  implementada
