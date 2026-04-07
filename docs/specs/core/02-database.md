# CORE - Database

## CORE-DB-001 - DATABASE_URL obrigatoria no startup

- Contexto de negocio:
  Sem conexao com banco, todos os modulos de negocio ficam indisponiveis.

- Regra principal:
  A inicializacao do DatabaseService deve falhar se DATABASE_URL nao estiver definida.

- Excecoes:
  Sem excecoes no ambiente padrao da API.

- Erros esperados:
  Erro de inicializacao explicito na carga do modulo.

- Criterio de aceite:
  App nao sobe quando DATABASE_URL estiver ausente.

- Rastreabilidade para codigo e testes:
  src/core/database/database.service.ts

- Status:
  implementada

## CORE-DB-002 - Pool de conexoes com limites padronizados

- Contexto de negocio:
  O banco precisa de controle de concorrencia e timeout para estabilidade.

- Regra principal:
  Pool deve iniciar com max 10 conexoes, idle timeout 30s e connection timeout 10s.

- Excecoes:
  Ajustes futuros de tuning podem alterar valores, mantendo a regra de limite explicito.

- Erros esperados:
  Timeout de conexao quando banco indisponivel.

- Criterio de aceite:
  Pool inicializa com os parametros configurados e validacao de conexao no startup.

- Rastreabilidade para codigo e testes:
  src/core/database/database.service.ts

- Status:
  implementada

## CORE-DB-003 - Encerramento limpo de conexoes

- Contexto de negocio:
  Encerramento incorreto pode deixar recursos abertos e impactar deploy/health.

- Regra principal:
  Ao destruir modulo, pool deve ser encerrado de forma explicita.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Logs de erro em shutdown anormal.

- Criterio de aceite:
  onModuleDestroy executa pool.end().

- Rastreabilidade para codigo e testes:
  src/core/database/database.service.ts

- Status:
  implementada
