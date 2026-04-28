import { Injectable } from '@nestjs/common';

import { LoggerService } from '../../../core/logger/logger.service';
import { ExportFiltersDto, ExportQueryDto } from '../dto';

/**
 * Mapper responsável por transformar parâmetros de query
 * em DTOs prontos para envio ao ETL e normalizar respostas.
 */
@Injectable()
export class DataIngestionMapper {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Monta ExportFiltersDto a partir dos query params do controller.
   */
  buildExportFilters(propriedadeId: string, query: ExportQueryDto): ExportFiltersDto {
    const filters = new ExportFiltersDto();
    filters.propriedadeId = propriedadeId;

    if (query.grupoId) filters.grupoId = query.grupoId;
    if (query.maturidade) filters.maturidade = query.maturidade;
    if (query.sexo) filters.sexo = query.sexo;
    if (query.tipo) filters.tipo = query.tipo;
    if (query.de) filters.de = query.de;
    if (query.ate) filters.ate = query.ate;

    this.logger.debug('Export filters montados', {
      module: 'DataIngestionMapper',
      method: 'buildExportFilters',
      propriedadeId,
      filtersCount: Object.keys(query).filter((k) => query[k as keyof typeof query]).length,
    });

    return filters;
  }

  /**
   * Monta o nome do arquivo para download no export.
   */
  buildExportFileName(domain: string, propriedadeId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${domain}_${propriedadeId}_${timestamp}.xlsx`;
  }
}
