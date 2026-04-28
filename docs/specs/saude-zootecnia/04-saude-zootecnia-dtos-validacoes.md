# SAUDE-ZOOTECNIA - DTOs e Validacoes

## SZO-DTO-001 - DTO sanitario valida identidade clinica e dados de aplicacao

- Contexto de negocio:
  Registro sanitario exige vinculo com animal/medicacao e dados minimos de aplicacao.

- Regra principal:
  CreateDadosSanitariosDto deve validar UUIDs de bufalo e medicacao, data de aplicacao, dosagem numerica e unidade de medida.

- Excecoes:
  Doenca, retorno e data de retorno sao opcionais.

- Erros esperados:
  400 para UUID invalido, data invalida ou tipos incoerentes.

- Criterio de aceite:
  DTO usa class-validator para campos obrigatorios e opcionais do contrato.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dto/create-dados-sanitarios.dto.ts
  src/modules/saude-zootecnia/dados-sanitarios/dto/update-dados-sanitarios.dto.ts

- Status:
  implementada

## SZO-DTO-002 - DTO zootecnico valida metricas e data opcional de registro

- Contexto de negocio:
  Indicadores zootecnicos precisam consistencia numerica para analise de evolucao do animal.

- Regra principal:
  CreateDadoZootecnicoDto deve validar peso, condicao corporal, tipo de pesagem e converter dtRegistro para Date quando informado.

- Excecoes:
  Cor de pelagem, formato de chifre e porte corporal sao opcionais.

- Erros esperados:
  400 para tipos invalidos ou campos obrigatorios ausentes.

- Criterio de aceite:
  DTO usa @Type(() => Date), IsNumber, IsString e campos opcionais declarativos.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-zootecnicos/dto/create-dado-zootecnico.dto.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dto/update-dado-zootecnico.dto.ts

- Status:
  implementada

## SZO-DTO-003 - DTO de medicacao exige propriedade e identificacao do tratamento

- Contexto de negocio:
  Catalogo de medicacao precisa ser escopado por propriedade e tipo de tratamento.

- Regra principal:
  CreateMedicacaoDto deve exigir idPropriedade UUID, tipoTratamento por enum canônico e medicacao, com normalizacao de aliases no contrato de entrada.

- Excecoes:
  Descricao e opcional.

- Erros esperados:
  400 para idPropriedade invalido ou campos obrigatorios ausentes.

- Criterio de aceite:
  DTO define validacao de UUID, obrigatoriedade e IsEnum para tipoTratamento apos normalizacao.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/medicamentos/dto/create-medicacao.dto.ts
  src/modules/saude-zootecnia/medicamentos/dto/update-medicacao.dto.ts
  src/modules/saude-zootecnia/medicamentos/enums/tipo-tratamento.enum.ts

- Status:
  implementada

## SZO-DTO-004 - DTO de vacinacao valida medicacao, datas e campos de reforco

- Contexto de negocio:
  Registro de vacinacao precisa rastrear aplicacao e possivel retorno para reforco.

- Regra principal:
  CreateVacinacaoDto deve validar idMedicacao, dtAplicacao e tipos de dosagem/unidade/retorno quando informados.

- Excecoes:
  Dosagem, unidade, doenca, necessidade de retorno e data de retorno sao opcionais.

- Erros esperados:
  400 para valores invalidos de ID, data ou tipo.

- Criterio de aceite:
  DTO de vacinacao usa IsUUID, IsDateString, IsNumber, IsBoolean e integra ToBoolean/validators de data do Core (nao futuro e data de retorno apos aplicacao).

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/vacinacao/dto/create-vacinacao.dto.ts
  src/modules/saude-zootecnia/vacinacao/dto/update-vacinacao.dto.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts

- Status:
  implementada

## SZO-DTO-005 - Contratos de listagem reutilizam paginacao compartilhada

- Contexto de negocio:
  Endpoints de historico precisam resposta paginada padronizada para consumo consistente no frontend.

- Regra principal:
  Dados sanitarios, dados zootecnicos e vacinacao reutilizam PaginationDto/PaginatedResponse e utilitarios de paginacao do Core.

- Excecoes:
  Medicamentos segue com listagens sem paginacao explicita no estado atual.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Controllers/services de dados sanitarios, dados zootecnicos e vacinacao aceitam PaginationDto e retornam PaginatedResponse.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.controller.ts
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.controller.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.controller.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.ts
  src/core/dto/pagination.dto.ts

- Status:
  implementada

## SZO-TEST-001 - Cobertura de testes dedicada para saude-zootecnia esta implementada

- Contexto de negocio:
  Regras de saude e tratamento tem risco de regressao e demandam testes unitarios/e2e especificos.

- Regra principal:
  Modulo possui suites dedicadas para dados-sanitarios, dados-zootecnicos, medicamentos e vacinacao, incluindo cobertura de rotas por propriedade com guards.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Existem suites .spec.ts no modulo cobrindo restore, ownership, cache, paginacao e controllers por propriedade com SupabaseAuthGuard/PropertyExistsGuard.

- Rastreabilidade para codigo e testes:
  src/modules/saude-zootecnia/
  src/modules/saude-zootecnia/dados-sanitarios/dados-sanitarios.service.spec.ts
  src/modules/saude-zootecnia/dados-zootecnicos/dados-zootecnicos.service.spec.ts
  src/modules/saude-zootecnia/medicamentos/medicamentos.service.spec.ts
  src/modules/saude-zootecnia/vacinacao/vacinacao.service.spec.ts
  src/modules/saude-zootecnia/saude-zootecnia.controller.property-guards.spec.ts

- Status:
  implementada
