import { Injectable } from '@nestjs/common';
import { DadosSanitariosRepositoryDrizzle } from '../../dados-sanitarios/repositories';
import { CreateVacinacaoDto } from '../dto/create-vacinacao.dto';
import { UpdateVacinacaoDto } from '../dto/update-vacinacao.dto';

/**
 * Repository específico para Vacinação
 * Encapsula o repository de DadosSanitarios, pois vacinação usa a mesma tabela
 * Adiciona lógica específica de vacinação (filtros, validações, etc)
 */
@Injectable()
export class VacinacaoRepositoryDrizzle {
  // IDs de medicações que são vacinas específicas
  private readonly VACCINE_IDS = [3, 4, 5, 6, 12, 14];

  constructor(private readonly dadosSanitariosRepository: DadosSanitariosRepositoryDrizzle) {}

  /**
   * Cria um registro de vacinação
   * Converte DTO de vacinação para formato de dados sanitários
   */
  async create(dto: CreateVacinacaoDto, idBufalo: string, idUsuario: string) {
    const sanitarioDto = {
      id_bufalo: idBufalo,
      id_medicao: dto.id_medicacao,
      dt_aplicacao: dto.dt_aplicacao,
      dosagem: dto.dosagem || 0,
      unidade_medida: dto.unidade_medida || 'ml',
      doenca: dto.doenca || 'Vacinação Preventiva',
      necessita_retorno: dto.necessita_retorno || false,
      dt_retorno: dto.dt_retorno,
    };

    return this.dadosSanitariosRepository.create(sanitarioDto, idUsuario, sanitarioDto.doenca);
  }

  /**
   * Busca todas as vacinações de um búfalo
   */
  async findByBufalo(idBufalo: string, limit: number, offset: number) {
    return this.dadosSanitariosRepository.findByBufalo(idBufalo, limit, offset);
  }

  /**
   * Busca apenas vacinas específicas de um búfalo (filtra por IDs de medicações)
   */
  async findVacinasByBufalo(idBufalo: string, limit: number, offset: number) {
    const result = await this.dadosSanitariosRepository.findByBufalo(idBufalo, limit, offset);

    // Filtra apenas as vacinas específicas
    const vacinasEspecificas = result.data.filter((registro) => this.VACCINE_IDS.includes(Number(registro.idMedicao)));

    return {
      data: vacinasEspecificas,
      total: vacinasEspecificas.length,
    };
  }

  /**
   * Busca uma vacinação por ID
   */
  async findById(idSanit: string) {
    return this.dadosSanitariosRepository.findById(idSanit);
  }

  /**
   * Atualiza uma vacinação
   */
  async update(idSanit: string, dto: UpdateVacinacaoDto) {
    const updateDto = {
      id_medicao: dto.id_medicacao,
      dt_aplicacao: dto.dt_aplicacao,
      dosagem: dto.dosagem,
      unidade_medida: dto.unidade_medida,
      doenca: dto.doenca,
      necessita_retorno: dto.necessita_retorno,
      dt_retorno: dto.dt_retorno,
    };

    return this.dadosSanitariosRepository.update(idSanit, updateDto, updateDto.doenca);
  }

  /**
   * Remove logicamente uma vacinação
   */
  async softDelete(idSanit: string) {
    return this.dadosSanitariosRepository.softDelete(idSanit);
  }

  /**
   * Restaura uma vacinação removida
   */
  async restore(idSanit: string) {
    return this.dadosSanitariosRepository.restore(idSanit);
  }

  /**
   * Lista todas as vacinações incluindo removidas
   */
  async findAllWithDeleted() {
    return this.dadosSanitariosRepository.findAllWithDeleted();
  }

  /**
   * Valida se uma medicação é uma vacina
   */
  async findMedicacaoById(idMedicacao: string) {
    return this.dadosSanitariosRepository.findMedicacaoById(idMedicacao);
  }
}
