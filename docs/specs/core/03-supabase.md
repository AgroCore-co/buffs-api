# CORE - Supabase

## CORE-SUPA-001 - Credenciais obrigatorias para cliente normal e admin

- Contexto de negocio:
  Fluxos de autenticacao dependem de operacoes normais e administrativas no Supabase.

- Regra principal:
  O modulo deve exigir SUPABASE_URL, SUPABASE_KEY e SUPABASE_SERVICE_ROLE_KEY no startup.

- Excecoes:
  Sem excecoes em execucao da API principal.

- Erros esperados:
  Erro de inicializacao quando qualquer chave obrigatoria estiver ausente.

- Criterio de aceite:
  Sem as variaveis, o SupabaseService nao instancia clientes.

- Rastreabilidade para codigo e testes:
  src/core/supabase/supabase.service.ts

- Status:
  implementada

## CORE-SUPA-002 - Separacao de cliente normal e cliente admin

- Contexto de negocio:
  Operacoes administrativas (ex: gestao de usuario) exigem contexto separado por seguranca.

- Regra principal:
  O Core deve expor cliente normal para operacoes comuns e cliente admin para operacoes privilegiadas.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Chamada administrativa com credencial comum deve falhar por permissao no provedor.

- Criterio de aceite:
  getClient() e getAdminClient() retornam instancias distintas, com auth admin sem persistencia de sessao.

- Rastreabilidade para codigo e testes:
  src/core/supabase/supabase.service.ts

- Status:
  implementada

## CORE-SUPA-003 - Modulo Supabase reutilizavel

- Contexto de negocio:
  Varios modulos de dominio usam Supabase e precisam de provider unico.

- Regra principal:
  SupabaseModule deve exportar SupabaseService para consumo em toda a aplicacao.

- Excecoes:
  Sem excecoes funcionais.

- Erros esperados:
  Falha de DI se modulo deixar de exportar provider.

- Criterio de aceite:
  Modulos de auth e guard conseguem injetar SupabaseService.

- Rastreabilidade para codigo e testes:
  src/core/supabase/supabase.module.ts
  src/modules/auth/auth.service.ts
  src/modules/auth/guards/email-verified.guard.ts

- Status:
  implementada
