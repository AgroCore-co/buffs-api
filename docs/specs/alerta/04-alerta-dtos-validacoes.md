# ALERTA - DTOs e Validacoes

## ALERTA-DTO-001 - Contrato de criacao exige id_propriedade valido

- Contexto de negocio:
  Todo alerta deve pertencer a uma propriedade para manter isolamento multi-tenant.

- Regra principal:
  id_propriedade e obrigatorio e validado como UUID.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para id_propriedade ausente ou invalido.

- Criterio de aceite:
  CreateAlertaDto aplica @IsUUID + @IsNotEmpty em id_propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-002 - Nicho do alerta e restrito ao enum oficial

- Contexto de negocio:
  Relatorios e verificacoes por nicho dependem de taxonomia fechada.

- Regra principal:
  Campo nicho deve aceitar apenas CLINICO, SANITARIO, REPRODUCAO, MANEJO ou PRODUCAO.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para valor fora do enum.

- Criterio de aceite:
  DTO usa @IsEnum(NichoAlerta) em campo obrigatorio.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-003 - Data do alerta exige formato de data valido

- Contexto de negocio:
  Ordenacao por agenda depende de data consistente.

- Regra principal:
  data_alerta deve ser valida por @IsDateString.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para valor fora de formato de data suportado.

- Criterio de aceite:
  Campo data_alerta e obrigatorio com @IsDateString + @IsNotEmpty.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-004 - Prioridade e opcional e limitada ao enum BAIXA/MEDIA/ALTA

- Contexto de negocio:
  Alguns fluxos deixam prioridade para classificacao posterior por IA.

- Regra principal:
  Quando informada, prioridade deve respeitar enum PrioridadeAlerta.

- Excecoes:
  Ausencia de prioridade e permitida.

- Erros esperados:
  400 para prioridade fora do enum.

- Criterio de aceite:
  DTO aplica @IsOptional + @IsEnum(PrioridadeAlerta).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-005 - Campos complementares sao opcionais e tipados

- Contexto de negocio:
  Nem todo alerta possui animal individual, grupo, localizacao ou observacoes adicionais.

- Regra principal:
  animal_id, grupo, localizacao, texto_ocorrencia_clinica, observacao e visto devem ser opcionais com validacao de tipo.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 para tipo invalido quando o campo for enviado.

- Criterio de aceite:
  DTO aplica combinacoes de @IsOptional com @IsUUID/@IsString/@IsBoolean conforme o campo.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-006 - Chave de evento de origem aceita transformacao de string vazia para undefined

- Contexto de negocio:
  Integracoes podem enviar id_evento_origem vazio; sem saneamento, validacao de UUID quebraria input opcional.

- Regra principal:
  id_evento_origem deve converter string vazia para undefined antes da validacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 apenas quando houver valor nao vazio e nao-UUID.

- Criterio de aceite:
  Campo usa @Transform(({ value }) => (value === '' ? undefined : value)).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-007 - DTO de update reutiliza contrato de create por PartialType

- Contexto de negocio:
  Atualizacao parcial deve manter regras de tipos sem duplicacao de declaracoes.

- Regra principal:
  UpdateAlertaDto deve herdar de PartialType(CreateAlertaDto).

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  UpdateAlertaDto e declarado como extends PartialType(CreateAlertaDto).

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-008 - Exemplos Swagger de IDs seguem o formato UUID validado no contrato

- Contexto de negocio:
  Documentacao de API deveria orientar o consumidor para formato aceito pelo validador.

- Regra principal:
  Exemplos de animal_id e id_evento_origem devem usar UUID quando o campo e @IsUUID.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 quando valores enviados para campos UUID nao estiverem no formato valido.

- Criterio de aceite:
  DTO traz examples UUID para campos validados como UUID.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/dto/create-alerta.dto.ts

- Status:
  implementada

## ALERTA-DTO-009 - Query de nichos no endpoint manual aplica validacao formal de enum

- Contexto de negocio:
  Se o cliente enviar nicho invalido, o processamento manual deveria rejeitar entrada explicitamente.

- Regra principal:
  Parametro query nichos deve ser validado contra enum oficial antes de executar verificacao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  400 (BadRequestException) quando houver nicho fora de CLINICO, SANITARIO, REPRODUCAO, MANEJO ou PRODUCAO.

- Criterio de aceite:
  AlertasController e AlertasVerificacaoService normalizam nichos e validam valores contra Object.values(NichoAlerta), lancando erro para itens invalidos.

- Rastreabilidade para codigo e testes:
  src/modules/alerta/alerta.controller.ts
  src/modules/alerta/services/alertas-verificacao.service.ts

- Status:
  implementada
