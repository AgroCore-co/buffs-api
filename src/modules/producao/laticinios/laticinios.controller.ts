import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { LaticiniosService } from './laticinios.service';
import { CreateLaticiniosDto, UpdateLaticiniosDto } from './dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Laticínios')
@Controller('laticinios')
export class LaticiniosController {
  constructor(
    private readonly service: LaticiniosService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova indústria' })
  @ApiBody({ type: CreateLaticiniosDto })
  @ApiResponse({ status: 201, description: 'Laticínio cadastrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateLaticiniosDto, @User() user: any) {
    this.logger.logApiRequest('POST', '/laticinios', undefined, { module: 'LaticiniosController', method: 'create', nome: dto.nome });
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as indústrias cadastradas' })
  @ApiResponse({ status: 200, description: 'Lista de indústrias retornada com sucesso.' })
  findAll(@User() user: any) {
    this.logger.logApiRequest('GET', '/laticinios', undefined, { module: 'LaticiniosController', method: 'findAll' });
    return this.service.findAll(user);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista as indústrias associadas a uma propriedade específica' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiResponse({ status: 200, description: 'Lista de indústrias da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any) {
    this.logger.logApiRequest('GET', `/laticinios/propriedade/${id_propriedade}`, undefined, {
      module: 'LaticiniosController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma indústria pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da indústria', type: 'string' })
  @ApiResponse({ status: 200, description: 'Indústria encontrada.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('GET', `/laticinios/${id}`, undefined, { module: 'LaticiniosController', method: 'findOne', industriaId: id });
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de uma indústria' })
  @ApiParam({ name: 'id', description: 'ID da indústria a ser atualizada', type: 'string' })
  @ApiBody({ type: UpdateLaticiniosDto })
  @ApiResponse({ status: 200, description: 'Indústria atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLaticiniosDto, @User() user: any) {
    this.logger.logApiRequest('PATCH', `/laticinios/${id}`, undefined, { module: 'LaticiniosController', method: 'update', industriaId: id });
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover indústria (soft delete)',
    description: 'Remove logicamente uma indústria. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id', description: 'ID da indústria a ser removida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Indústria removida com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('DELETE', `/laticinios/${id}`, undefined, { module: 'LaticiniosController', method: 'remove', industriaId: id });
    return this.service.remove(id, user);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar indústria removida',
    description: 'Restaura uma indústria que foi removida (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID da indústria a ser restaurada', type: 'string' })
  @ApiResponse({ status: 200, description: 'Indústria restaurada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  @ApiResponse({ status: 400, description: 'Indústria não está removida.' })
  restore(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('POST', `/laticinios/${id}/restore`, undefined, { module: 'LaticiniosController', method: 'restore', industriaId: id });
    return this.service.restore(id, user);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todas as indústrias incluindo removidas',
    description: 'Retorna todas as indústrias, incluindo as removidas (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted(@User() user: any) {
    this.logger.logApiRequest('GET', '/laticinios/deleted/all', undefined, { module: 'LaticiniosController', method: 'findAllWithDeleted' });
    return this.service.findAllWithDeleted(user);
  }
}
