# SAUDE-ZOOTECNIA - Visao Geral

## SZO-ARCH-001 - Modulo agrega subdominios sanitarios e zootecnicos

- Contexto de negocio:
  Saude do rebanho exige separar historico clinico, metricas zootecnicas e catalogo de tratamento.

- Regra principal:
  SaudeZootecniaModule deve compor submodulos de dados sanitarios, dados zootecnicos e medicacoes.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI se submodulos nao forem registrados.

- Criterio de aceite:
  SaudeZootecniaModule importa DadosSanitariosModule, DadosZootecnicosModule e MedicamentosModule.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/saude-zootecnia.module.ts

- Status:
  implementada

## SZO-ARCH-002 - Endpoints do dominio exigem autenticacao JWT

- Contexto de negocio:
  Dados de saude e zootecnia sao sensiveis e nao devem ser expostos anonimamente.

- Regra principal:
  Controllers do modulo devem aplicar SupabaseAuthGuard em nivel de classe.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  401 para token ausente, invalido ou expirado.

- Criterio de aceite:
  Controllers de dados-sanitarios, dados-zootecnicos, medicamentos e vacinacao estao com @UseGuards(SupabaseAuthGuard).

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.controller.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.controller.ts
  src/modules/saude-zootecnia/medicamentos/medicamentos.controller.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.controller.ts

- Status:
  implementada

## SZO-ARCH-003 - Submodulo de vacinacao nao esta composto no modulo raiz

- Contexto de negocio:
  Vacinacao faz parte do dominio de saude, mas precisa estar exposta no agregado principal para composicao consistente.

- Regra principal:
  SaudeZootecniaModule deveria importar VacinacaoModule para incluir explicitamente este subdominio na composicao do modulo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, vacinacao nao participa da composicao do modulo raiz de saude-zootecnia.

- Criterio de aceite:
  Existe VacinacaoModule, mas SaudeZootecniaModule nao o importa.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/saude-zootecnia.module.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.module.ts

- Status:
  parcial
