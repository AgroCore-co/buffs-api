# ALIMENTACAO - Registros

## ALIM-REG-001 - Registro exige usuario interno autenticado

- Contexto de negocio:
  Cada ocorrencia de alimentacao precisa autoria para rastreabilidade.

- Regra principal:
  Controller de create deve exigir claim id_usuario e bloquear quando usuario autenticado nao tiver perfil local.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  ForbiddenException quando id_usuario estiver ausente.

- Criterio de aceite:
  create injeta @User('id_usuario') e retorna erro quando valor for null.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/registros/registros.controller.ts
  src/modules/auth/decorators/user.decorator.ts

- Status:
  implementada

## ALIM-REG-002 - Grupo deve pertencer a propriedade do registro

- Contexto de negocio:
  Registro nao pode associar grupo de uma propriedade com id_propriedade diferente.

- Regra principal:
  Antes de inserir, service deve validar que id_grupo existe e que grupo.idPropriedade == dto.id_propriedade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para grupo inexistente; BadRequestException para grupo de outra propriedade.

- Criterio de aceite:
  Registro e bloqueado quando grupo nao existir ou nao pertencer a propriedade informada.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/registros/registros.service.ts

- Status:
  implementada

## ALIM-REG-003 - Definicao de alimentacao deve pertencer a propriedade

- Contexto de negocio:
  Definicao de alimento nao pode ser reutilizada entre propriedades sem controle.

- Regra principal:
  Service deve validar que id_aliment_def existe e pertence a mesma propriedade do registro.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para definicao inexistente; BadRequestException para definicao de outra propriedade.

- Criterio de aceite:
  Registro e bloqueado em divergencia de propriedade da definicao.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/registros/registros.service.ts

- Status:
  implementada

## ALIM-REG-004 - Listagem por propriedade e paginada com joins de contexto

- Contexto de negocio:
  Operacao de consulta precisa trazer contexto de alimento, grupo e usuario em tela unica.

- Regra principal:
  findByPropriedade deve retornar resposta paginada com relacionamentos de alimentacaodef, grupo e usuario.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException para falha de count/list.

- Criterio de aceite:
  Repositorio aplica where por idPropriedade + isNull(deletedAt), com joins e ordenacao por dtRegistro/createdAt desc.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/registros/registros.service.ts
  src/modules/alimentacao/registros/repositories/registros.repository.drizzle.ts

- Status:
  implementada

## ALIM-REG-005 - Update parcial so em campos operacionais

- Contexto de negocio:
  Integridade de vinculos (propriedade, grupo, definicao, usuario) deve ser imutavel apos criacao do evento.

- Regra principal:
  Update de registro deve permitir somente quantidade, unidade_medida, freq_dia e dt_registro.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException quando registro nao existir; InternalServerErrorException em falha de update.

- Criterio de aceite:
  Repositorio mapeia apenas campos operacionais no updateData.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/registros/dto/update-registro.dto.ts
  src/modules/alimentacao/registros/repositories/registros.repository.drizzle.ts

- Status:
  implementada
