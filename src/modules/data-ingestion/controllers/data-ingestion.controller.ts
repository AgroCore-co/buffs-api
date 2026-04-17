import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  ParseUUIDPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';

import { DataIngestionService } from '../services/data-ingestion.service';
import { DataIngestionMapper } from '../mappers/data-ingestion.mapper';
import { ExportQueryDto, ImportResponseDto, JobStatusResponseDto } from '../dto';
import { MulterFile } from '../interfaces';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiTags('Data Ingestion')
@Controller('propriedades/:propriedadeId/data-ingestion')
export class DataIngestionController {
  constructor(
    private readonly service: DataIngestionService,
    private readonly mapper: DataIngestionMapper,
    private readonly logger: LoggerService,
  ) {}

  // ── Leite ────────────────────────────────────────────────

  @Post('leite')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '📊 Importar planilha de pesagem de leite',
    description: `
Envia uma planilha Excel (.xlsx) com dados de produção de leite para processamento pelo ETL.

**Colunas esperadas:** Brinco, Qtd. Produzida (L)

**Validações antes do envio:**
- Propriedade deve existir
- Usuário deve ter acesso à propriedade
- Arquivo deve ser .xlsx com no máximo 50 MB
- Máximo 10 importações por hora por propriedade
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo Excel (.xlsx) com dados de produção de leite.',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Planilha .xlsx (máximo 50 MB)' },
      },
    },
  })
  @ApiParam({ name: 'propriedadeId', description: 'UUID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Importação processada.', type: ImportResponseDto })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar a propriedade.' })
  @ApiResponse({ status: 422, description: 'Arquivo inválido ou muito grande.' })
  @ApiResponse({ status: 429, description: 'Rate limit atingido.' })
  @ApiResponse({ status: 503, description: 'Serviço ETL indisponível.' })
  async importLeite(
    @Param('propriedadeId', ParseUUIDPipe) propriedadeId: string,
    @UploadedFile() file: MulterFile,
    @User() user: any,
  ): Promise<ImportResponseDto> {
    this.logger.logApiRequest('POST', `/propriedades/${propriedadeId}/data-ingestion/leite`, undefined, {
      module: 'DataIngestionController',
      method: 'importLeite',
      propriedadeId,
    });

    return this.service.importLeite(propriedadeId, user, file);
  }

  @Get('leite/export')
  @ApiOperation({
    summary: '📥 Exportar planilha de leite',
    description: 'Gera e retorna uma planilha Excel (.xlsx) com dados de produção de leite filtrados.',
  })
  @ApiParam({ name: 'propriedadeId', description: 'UUID da propriedade', type: 'string' })
  @ApiQuery({ name: 'grupoId', required: false, description: 'UUID do grupo para filtrar' })
  @ApiQuery({ name: 'maturidade', required: false, enum: ['novilha', 'primipara', 'multipara'] })
  @ApiQuery({ name: 'de', required: false, description: 'Data inicial (ISO 8601)' })
  @ApiQuery({ name: 'ate', required: false, description: 'Data final (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Planilha Excel gerada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 503, description: 'Serviço ETL indisponível.' })
  async exportLeite(
    @Param('propriedadeId', ParseUUIDPipe) propriedadeId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) query: ExportQueryDto,
    @User() user: any,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.logApiRequest('GET', `/propriedades/${propriedadeId}/data-ingestion/leite/export`, undefined, {
      module: 'DataIngestionController',
      method: 'exportLeite',
      propriedadeId,
    });

    const filters = this.mapper.buildExportFilters(propriedadeId, query);
    const { buffer, filename } = await this.service.exportLeite(propriedadeId, user, filters);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ── Pesagem ──────────────────────────────────────────────

  @Post('pesagem')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '⚖️ Importar planilha de pesagem animal',
    description: `
Envia uma planilha Excel (.xlsx) com dados de pesagem dos animais para processamento pelo ETL.

**Colunas esperadas:** Brinco, Peso (kg)
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo Excel (.xlsx) com dados de pesagem.',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Planilha .xlsx (máximo 50 MB)' },
      },
    },
  })
  @ApiParam({ name: 'propriedadeId', description: 'UUID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Importação processada.', type: ImportResponseDto })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 422, description: 'Arquivo inválido ou muito grande.' })
  @ApiResponse({ status: 429, description: 'Rate limit atingido.' })
  @ApiResponse({ status: 503, description: 'Serviço ETL indisponível.' })
  async importPesagem(
    @Param('propriedadeId', ParseUUIDPipe) propriedadeId: string,
    @UploadedFile() file: MulterFile,
    @User() user: any,
  ): Promise<ImportResponseDto> {
    this.logger.logApiRequest('POST', `/propriedades/${propriedadeId}/data-ingestion/pesagem`, undefined, {
      module: 'DataIngestionController',
      method: 'importPesagem',
      propriedadeId,
    });

    return this.service.importPesagem(propriedadeId, user, file);
  }

  @Get('pesagem/export')
  @ApiOperation({
    summary: '📥 Exportar planilha de pesagem',
    description: 'Gera e retorna uma planilha Excel (.xlsx) com dados de pesagem filtrados.',
  })
  @ApiParam({ name: 'propriedadeId', description: 'UUID da propriedade', type: 'string' })
  @ApiQuery({ name: 'grupoId', required: false, description: 'UUID do grupo para filtrar' })
  @ApiQuery({ name: 'maturidade', required: false, enum: ['novilha', 'primipara', 'multipara'] })
  @ApiQuery({ name: 'sexo', required: false, enum: ['M', 'F'] })
  @ApiQuery({ name: 'de', required: false, description: 'Data inicial (ISO 8601)' })
  @ApiQuery({ name: 'ate', required: false, description: 'Data final (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Planilha Excel gerada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 503, description: 'Serviço ETL indisponível.' })
  async exportPesagem(
    @Param('propriedadeId', ParseUUIDPipe) propriedadeId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) query: ExportQueryDto,
    @User() user: any,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.logApiRequest('GET', `/propriedades/${propriedadeId}/data-ingestion/pesagem/export`, undefined, {
      module: 'DataIngestionController',
      method: 'exportPesagem',
      propriedadeId,
    });

    const filters = this.mapper.buildExportFilters(propriedadeId, query);
    const { buffer, filename } = await this.service.exportPesagem(propriedadeId, user, filters);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ── Reprodução ───────────────────────────────────────────

  @Post('reproducao')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '🧬 Importar planilha de reprodução',
    description: `
Envia uma planilha Excel (.xlsx) com dados de eventos reprodutivos para processamento pelo ETL.

**Colunas esperadas:** Brinco Macho, Brinco Fêmea, Tipo Inseminação, Cód. Material Genético (opcional)
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo Excel (.xlsx) com dados de reprodução.',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Planilha .xlsx (máximo 50 MB)' },
      },
    },
  })
  @ApiParam({ name: 'propriedadeId', description: 'UUID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Importação processada.', type: ImportResponseDto })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 422, description: 'Arquivo inválido ou muito grande.' })
  @ApiResponse({ status: 429, description: 'Rate limit atingido.' })
  @ApiResponse({ status: 503, description: 'Serviço ETL indisponível.' })
  async importReproducao(
    @Param('propriedadeId', ParseUUIDPipe) propriedadeId: string,
    @UploadedFile() file: MulterFile,
    @User() user: any,
  ): Promise<ImportResponseDto> {
    this.logger.logApiRequest('POST', `/propriedades/${propriedadeId}/data-ingestion/reproducao`, undefined, {
      module: 'DataIngestionController',
      method: 'importReproducao',
      propriedadeId,
    });

    return this.service.importReproducao(propriedadeId, user, file);
  }

  @Get('reproducao/export')
  @ApiOperation({
    summary: '📥 Exportar planilha de reprodução',
    description: 'Gera e retorna uma planilha Excel (.xlsx) com dados de reprodução filtrados.',
  })
  @ApiParam({ name: 'propriedadeId', description: 'UUID da propriedade', type: 'string' })
  @ApiQuery({ name: 'grupoId', required: false, description: 'UUID do grupo para filtrar' })
  @ApiQuery({ name: 'tipo', required: false, enum: ['MN', 'IA', 'IATF', 'TE'] })
  @ApiQuery({ name: 'de', required: false, description: 'Data inicial (ISO 8601)' })
  @ApiQuery({ name: 'ate', required: false, description: 'Data final (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Planilha Excel gerada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 503, description: 'Serviço ETL indisponível.' })
  async exportReproducao(
    @Param('propriedadeId', ParseUUIDPipe) propriedadeId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) query: ExportQueryDto,
    @User() user: any,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.logApiRequest('GET', `/propriedades/${propriedadeId}/data-ingestion/reproducao/export`, undefined, {
      module: 'DataIngestionController',
      method: 'exportReproducao',
      propriedadeId,
    });

    const filters = this.mapper.buildExportFilters(propriedadeId, query);
    const { buffer, filename } = await this.service.exportReproducao(propriedadeId, user, filters);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}

/**
 * Controller separado para rotas de job status que não dependem de propriedadeId.
 */
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Data Ingestion')
@Controller('data-ingestion')
export class DataIngestionJobController {
  constructor(
    private readonly service: DataIngestionService,
    private readonly logger: LoggerService,
    private readonly authHelper: AuthHelperService,
  ) {}

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: '🔄 Consultar status de um job de importação',
    description: 'Retorna o status atual de um job de processamento assíncrono.',
  })
  @ApiParam({ name: 'jobId', description: 'ID do job retornado na importação', type: 'string' })
  @ApiResponse({ status: 200, description: 'Status do job retornado.', type: JobStatusResponseDto })
  @ApiResponse({ status: 403, description: 'Usuário sem permissão para consultar este job.' })
  @ApiResponse({ status: 404, description: 'Job não encontrado (pode ter expirado ou sido removido pela rotina de limpeza).' })
  @ApiResponse({ status: 503, description: 'Serviço ETL indisponível.' })
  async getJobStatus(@Param('jobId') jobId: string, @User() user: any): Promise<JobStatusResponseDto> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.logApiRequest('GET', `/data-ingestion/jobs/${jobId}`, undefined, {
      module: 'DataIngestionJobController',
      method: 'getJobStatus',
      jobId,
      userId,
    });

    return this.service.getJobStatus(jobId, userId);
  }
}
