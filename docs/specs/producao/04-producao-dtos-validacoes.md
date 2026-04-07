# PRODUCAO - DTOs e Validacoes

## PROD-DTO-001 - DTOs de criacao exigem identificadores UUID nos relacionamentos

- Contexto de negocio:
  Entidades de producao dependem de referencias validas entre bufala, propriedade, ciclo, industria e usuario.

- Regra principal:
  DTOs de criacao devem validar IDs com @IsUUID('4').

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 quando qualquer identificador for invalido.

- Criterio de aceite:
  Todos os DTOs de create do modulo aplicam validacao de UUID nos campos de relacao.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/dto/create-ordenha.dto.ts
  src/modules/producao/lactacao/dto/create-lactacao.dto.ts
  src/modules/producao/producao-diaria/dto/create-producao-diaria.dto.ts
  src/modules/producao/retirada/dto/create-retirada.dto.ts
  src/modules/producao/laticinios/dto/create-laticinios.dto.ts
  src/modules/producao/predicao-producao/dto/predicao-producao.dto.ts

- Status:
  implementada

## PROD-DTO-002 - Datas operacionais possuem validacao de formato e nao-futuro

- Contexto de negocio:
  Registros de producao nao podem referenciar datas futuras.

- Regra principal:
  Campos de data de ordenha, parto, registro de estoque e coleta devem usar IsDateString e IsNotFutureDate.

- Excecoes:
  dtSecagemReal e opcional.

- Erros esperados:
  400 para data fora de formato ISO 8601 ou em data futura.

- Criterio de aceite:
  DTOs aplicam as anotacoes de data em todos os campos temporais obrigatorios do fluxo.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/dto/create-ordenha.dto.ts
  src/modules/producao/lactacao/dto/create-lactacao.dto.ts
  src/modules/producao/producao-diaria/dto/create-producao-diaria.dto.ts
  src/modules/producao/retirada/dto/create-retirada.dto.ts
  src/core/validators/date.validators.ts

- Status:
  implementada

## PROD-DTO-003 - Secagem real deve ocorrer depois da data de parto

- Contexto de negocio:
  A secagem e evento posterior ao parto no ciclo de lactacao.

- Regra principal:
  CreateCicloLactacaoDto deve validar dtSecagemReal com IsAfterDate('dtParto').

- Excecoes:
  dtSecagemReal pode ser omitida no inicio do ciclo.

- Erros esperados:
  400 quando dtSecagemReal for anterior ou igual a dtParto.

- Criterio de aceite:
  Campo dtSecagemReal usa @IsAfterDate('dtParto') no DTO de lactacao.

- Rastreabilidade para codigo e testes:
  src/modules/producao/lactacao/dto/create-lactacao.dto.ts
  src/core/validators/date.validators.ts

- Status:
  implementada

## PROD-DTO-004 - Campos de quantidade exigem numero positivo

- Contexto de negocio:
  Volumes de leite e duracao de ciclo precisam ser valores positivos.

- Regra principal:
  qtOrdenha, quantidade (estoque/coleta) e padraoDias devem ser numericos e positivos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para valores negativos, zero ou nao numericos.

- Criterio de aceite:
  DTOs usam combinacao de IsNumber/IsInt + IsPositive nos campos quantitativos.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/dto/create-ordenha.dto.ts
  src/modules/producao/lactacao/dto/create-lactacao.dto.ts
  src/modules/producao/producao-diaria/dto/create-producao-diaria.dto.ts
  src/modules/producao/retirada/dto/create-retirada.dto.ts

- Status:
  implementada

## PROD-DTO-005 - Contrato de periodo de ordenha e restrito a enum M/T/N

- Contexto de negocio:
  O registro de ordenha precisa padronizar turno operacional.

- Regra principal:
  O campo periodo de ordenha e opcional, mas quando informado deve respeitar enum M, T ou N.

- Excecoes:
  Campo pode ser omitido.

- Erros esperados:
  400 para valor fora do enum.

- Criterio de aceite:
  DTO define enum PeriodoOrdenha e valida com @IsEnum.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/dto/create-ordenha.dto.ts

- Status:
  implementada

## PROD-DTO-006 - Campos textuais possuem limites maximos por dominio

- Contexto de negocio:
  Observacoes e descricoes livres devem ter limites para evitar payloads excessivos.

- Regra principal:
  DTOs aplicam @MaxLength com limites de negocio por campo (ex.: 255 para ocorrencia de ordenha, 50 para observacao de retirada, 500 para observacoes longas).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para textos acima do limite.

- Criterio de aceite:
  MaxLength aparece em DTOs de ordenha, lactacao, producao diaria, retirada e laticinios.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/dto/create-ordenha.dto.ts
  src/modules/producao/lactacao/dto/create-lactacao.dto.ts
  src/modules/producao/producao-diaria/dto/create-producao-diaria.dto.ts
  src/modules/producao/retirada/dto/create-retirada.dto.ts
  src/modules/producao/laticinios/dto/create-laticinios.dto.ts

- Status:
  implementada

## PROD-DTO-007 - DTOs de atualizacao reutilizam contratos via PartialType

- Contexto de negocio:
  Atualizacoes parciais devem manter mesmas regras de tipo e validacao dos contratos de criacao.

- Regra principal:
  DTOs de update devem herdar de PartialType(CreateDto) para tornar campos opcionais sem duplicar contrato.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Todos os update DTOs do modulo sao definidos por PartialType.

- Rastreabilidade para codigo e testes:
  src/modules/producao/ordenha/dto/update-dados-lactacao.dto.ts
  src/modules/producao/lactacao/dto/update-lactacao.dto.ts
  src/modules/producao/producao-diaria/dto/update-producao-diaria.dto.ts
  src/modules/producao/retirada/dto/update-retirada.dto.ts
  src/modules/producao/laticinios/dto/update-laticinios.dto.ts

- Status:
  implementada

## PROD-DTO-008 - Contrato de estoque aceita idUsuario no payload sem vinculo obrigatorio ao token

- Contexto de negocio:
  Em API multi-tenant, autoria do registro deveria ser derivada do contexto autenticado para evitar spoofing.

- Regra principal:
  O create de producao diaria recebe idUsuario no body e nao extrai o valor diretamente do token no controller/service.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, cliente pode enviar idUsuario divergente do usuario autenticado.

- Criterio de aceite:
  Controller de producao diaria nao usa decorator @User para preencher autoria.

- Rastreabilidade para codigo e testes:
  src/modules/producao/producao-diaria/dto/create-producao-diaria.dto.ts
  src/modules/producao/producao-diaria/producao-diaria.controller.ts
  src/modules/producao/producao-diaria/producao-diaria.service.ts

- Status:
  parcial
