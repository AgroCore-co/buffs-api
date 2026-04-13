import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { ISoftDelete } from '../../../core/interfaces';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';
import { RacaRepositoryDrizzle } from './repositories/raca.repository.drizzle';
import { CacheService } from '../../../core/cache/cache.service';

@Injectable()
export class RacaService implements ISoftDelete {
  constructor(
    private readonly racaRepository: RacaRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
  ) {}

  private async invalidateCache(): Promise<void> {
    await this.cacheService.reset();
  }

  async create(createRacaDto: CreateRacaDto) {
    this.logger.log('Iniciando criação de raça', { module: 'RacaService', method: 'create' });
    const raca = await this.racaRepository.create(createRacaDto);
    await this.invalidateCache();
    this.logger.log('Raça criada com sucesso', { module: 'RacaService', method: 'create', racaId: raca.idRaca });
    return raca;
  }

  async findAll() {
    this.logger.log('Iniciando busca de todas as raças', { module: 'RacaService', method: 'findAll' });
    const racas = await this.racaRepository.findAll();
    this.logger.log(`Busca de raças concluída - ${racas.length} raças encontradas`, { module: 'RacaService', method: 'findAll' });
    return racas;
  }

  async findOne(id: string) {
    this.logger.log('Iniciando busca de raça por ID', { module: 'RacaService', method: 'findOne', racaId: id });
    const raca = await this.racaRepository.findById(id);

    if (!raca) {
      this.logger.warn('Raça não encontrada', { module: 'RacaService', method: 'findOne', racaId: id });
      throw new NotFoundException('Raça não encontrada.');
    }

    this.logger.log('Raça encontrada com sucesso', { module: 'RacaService', method: 'findOne', racaId: id });
    return raca;
  }

  async update(id: string, updateRacaDto: UpdateRacaDto) {
    this.logger.log('Iniciando atualização de raça', { module: 'RacaService', method: 'update', racaId: id });

    await this.findOne(id);
    const racaAtualizada = await this.racaRepository.update(id, updateRacaDto);
    await this.invalidateCache();

    this.logger.log('Raça atualizada com sucesso', { module: 'RacaService', method: 'update', racaId: id });
    return racaAtualizada;
  }

  async remove(id: string) {
    return this.softDelete(id);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de raça', { module: 'RacaService', method: 'softDelete', racaId: id });

    await this.findOne(id);
    const raca = await this.racaRepository.softDelete(id);
    await this.invalidateCache();

    this.logger.log('Raça removida com sucesso', { module: 'RacaService', method: 'softDelete', racaId: id });
    return {
      message: 'Raça removida com sucesso (soft delete)',
      data: raca,
    };
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de raça', { module: 'RacaService', method: 'restore', racaId: id });

    const raca = await this.racaRepository.findByIdWithDeleted(id);

    if (!raca) {
      this.logger.warn('Raça não encontrada para restauração', { module: 'RacaService', method: 'restore', racaId: id });
      throw new NotFoundException('Raça não encontrada.');
    }

    if (!raca.deletedAt) {
      this.logger.warn('Tentativa de restaurar raça não removida', { module: 'RacaService', method: 'restore', racaId: id });
      throw new BadRequestException('Esta raça não está removida.');
    }

    const racaRestaurada = await this.racaRepository.restore(id);
    await this.invalidateCache();

    this.logger.log('Raça restaurada com sucesso', { module: 'RacaService', method: 'restore', racaId: id });
    return {
      message: 'Raça restaurada com sucesso',
      data: racaRestaurada,
    };
  }

  async findAllWithDeleted() {
    this.logger.log('Iniciando busca de todas as raças (incluindo removidas)', { module: 'RacaService', method: 'findAllWithDeleted' });
    const racas = await this.racaRepository.findAllWithDeleted();
    this.logger.log(`Busca de raças concluída - ${racas.length} raças encontradas (incluindo removidas)`, {
      module: 'RacaService',
      method: 'findAllWithDeleted',
    });
    return racas;
  }
}
