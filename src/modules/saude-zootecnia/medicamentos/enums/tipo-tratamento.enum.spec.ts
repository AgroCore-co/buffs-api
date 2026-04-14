import { describe, expect, it } from '@jest/globals';
import { getTipoTratamentoAliases, normalizeTipoTratamento, TipoTratamentoMedicacao } from './tipo-tratamento.enum';

describe('TipoTratamentoMedicacao enum', () => {
  it('deve normalizar aliases de vacinacao para valor canônico', () => {
    expect(normalizeTipoTratamento('vacina')).toBe(TipoTratamentoMedicacao.VACINACAO);
    expect(normalizeTipoTratamento('Vacinação')).toBe(TipoTratamentoMedicacao.VACINACAO);
    expect(normalizeTipoTratamento('imunizacao')).toBe(TipoTratamentoMedicacao.VACINACAO);
  });

  it('deve normalizar aliases de vermifugacao', () => {
    expect(normalizeTipoTratamento('Vermifugação')).toBe(TipoTratamentoMedicacao.VERMIFUGACAO);
    expect(normalizeTipoTratamento('antiparasitario')).toBe(TipoTratamentoMedicacao.VERMIFUGACAO);
  });

  it('deve retornar undefined para tipo desconhecido', () => {
    expect(normalizeTipoTratamento('quimioterapia')).toBeUndefined();
  });

  it('deve expor aliases de vacinacao para uso semântico', () => {
    expect(getTipoTratamentoAliases(TipoTratamentoMedicacao.VACINACAO)).toEqual(expect.arrayContaining(['vacinacao', 'vacina', 'imunizacao']));
  });
});
