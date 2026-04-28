import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { MovLoteService } from './mov-lote.service';
import { CreateMovLoteDto, UpdateMovLoteDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { PropertyExistsGuard } from '../../../core/guards/property-exists.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Movimentação de Lotes')
@Controller('mov-lote')
export class MovLoteController {
  constructor(
    private readonly service: MovLoteService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registra movimentação física de um grupo para novo lote',
    description: 'Move um grupo inteiro de animais de um lote/pasto para outro, registrando o histórico de movimentação física.',
  })
  @ApiResponse({ status: 201, description: 'Movimentação registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  async create(@Body() createDto: CreateMovLoteDto, @User() user: any) {
    this.logger.logApiRequest('POST', '/mov-lote', undefined, {
      module: 'MovLoteController',
      method: 'create',
      userId: user?.sub || user?.id,
    });

    return this.service.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as movimentações de lotes' })
  @ApiResponse({ status: 200, description: 'Lista de movimentações retornada com sucesso.' })
  findAll(@User() user: any, @Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', '/mov-lote', undefined, {
      module: 'MovLoteController',
      method: 'findAll',
    });
    return this.service.findAll(user, paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @UseGuards(PropertyExistsGuard)
  @ApiOperation({ summary: 'Lista movimentações de lotes por propriedade com paginação' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto, @User() user: any) {
    this.logger.logApiRequest('GET', `/mov-lote/propriedade/${id_propriedade}`, undefined, {
      module: 'MovLoteController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade, paginationDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma movimentação pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da movimentação' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma movimentação' })
  @ApiParam({ name: 'id', description: 'ID da movimentação a ser atualizada' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMovLoteDto, @User() user: any) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove o registro de uma movimentação' })
  @ApiParam({ name: 'id', description: 'ID da movimentação a ser removida' })
  @ApiResponse({ status: 204, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.service.remove(id, user);
  }

  @Get('historico/grupo/:id_grupo')
  @ApiOperation({
    summary: 'Busca o histórico completo de movimentações de um grupo',
    description: 'Retorna todas as movimentações físicas de um grupo específico, ordenadas pela data mais recente.',
  })
  @ApiParam({ name: 'id_grupo', description: 'ID do grupo para consultar o histórico' })
  @ApiResponse({ status: 200, description: 'Histórico de movimentações do grupo.' })
  async findHistoricoGrupo(@Param('id_grupo', ParseUUIDPipe) id_grupo: string, @User() user: any) {
    return this.service.findHistoricoByGrupo(id_grupo, user);
  }

  @Get('status/grupo/:id_grupo')
  @ApiOperation({
    summary: 'Verifica o status atual de localização de um grupo',
    description: 'Retorna onde o grupo está localizado atualmente (lote atual) e desde quando.',
  })
  @ApiParam({ name: 'id_grupo', description: 'ID do grupo para verificar status atual' })
  @ApiResponse({ status: 200, description: 'Status atual do grupo.' })
  async findStatusAtual(@Param('id_grupo', ParseUUIDPipe) id_grupo: string, @User() user: any) {
    return this.service.findStatusAtual(id_grupo, user);
  }
}
