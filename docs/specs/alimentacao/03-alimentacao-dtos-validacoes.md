# ALIMENTACAO - DTOs e Validacoes

## ALIM-DTO-001 - DTO de definicao exige identificacao da propriedade

- Contexto de negocio:
  Catalogo de alimentacao e escopado por propriedade.

- Regra principal:
  CreateAlimentacaoDefDto deve exigir id_propriedade UUID e tipo_alimentacao obrigatorio com limite de tamanho.

- Excecoes:
  descricao e opcional.

- Erros esperados:
  400 para id_propriedade invalido, tipo vazio ou excesso de tamanho.

- Criterio de aceite:
  Payload invalido e rejeitado pela validacao de DTO.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/alimentacao-def/dto/create-alimentacao-def.dto.ts

- Status:
  implementada

## ALIM-DTO-002 - DTO de registro exige vinculos e quantidade positiva

- Contexto de negocio:
  Evento de fornecimento precisa relacao consistente com propriedade, grupo e definicao.

- Regra principal:
  CreateRegistroAlimentacaoDto deve exigir UUIDs de id_propriedade, id_grupo e id_aliment_def, alem de quantidade > 0 e unidade_medida.

- Excecoes:
  freq_dia e dt_registro sao opcionais.

- Erros esperados:
  400 para ids invalidos, quantidade <= 0, unidade vazia ou dt_registro fora de formato ISO.

- Criterio de aceite:
  DTO valida campos obrigatorios e limites minimos antes de chegar ao service.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/registros/dto/create-registro.dto.ts

- Status:
  implementada

## ALIM-DTO-003 - DTO de update restringe alteracoes

- Contexto de negocio:
  Atualizacao deve preservar integridade estrutural do registro original.

- Regra principal:
  UpdateRegistroAlimentacaoDto deve limitar campos editaveis a quantidade, unidade_medida, freq_dia e dt_registro.

- Excecoes:
  Todos os campos sao opcionais (patch parcial).

- Erros esperados:
  400 para valores fora de faixa ou formato invalido.

- Criterio de aceite:
  Campos estruturais de vinculo nao aparecem no DTO de update.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/registros/dto/update-registro.dto.ts

- Status:
  implementada

## ALIM-TEST-001 - Cobertura de testes automatizados do modulo

- Contexto de negocio:
  Regras de consistencia entre propriedade, grupo e definicao tem risco de regressao funcional.

- Regra principal:
  Modulo deveria possuir testes unitarios/e2e dedicados para create e validacoes cruzadas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual nao foram encontrados testes especificos de alimentacao em test/.

- Rastreabilidade para codigo e testes:
  src/modules/alimentacao/
  test/

- Status:
  parcial
