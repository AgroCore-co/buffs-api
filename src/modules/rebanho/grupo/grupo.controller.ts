import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseUUIDPipe, UseInterceptors, Query } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { GrupoService } from './grupo.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateGrupoDto, UpdateGrupoDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PropertyExistsGuard } from '../../../core/guards/property-exists.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Grupos')
@Controller('grupos')
export class GrupoController {
  constructor(
    private readonly grupoService: GrupoService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Lista todos os grupos',
    description: 'Retorna uma lista de todos os grupos de búfalos cadastrados no sistema, ordenados alfabeticamente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de grupos retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll(@User() user: any) {
    this.logger.logApiRequest('GET', '/grupos', undefined, { module: 'GrupoController', method: 'findAll' });
    return this.grupoService.findAll(user);
  }

  @Get('propriedade/:id_propriedade')
  @UseGuards(PropertyExistsGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({ summary: 'Lista grupos por propriedade com paginação' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto, @User() user: any) {
    this.logger.logApiRequest('GET', `/grupos/propriedade/${id_propriedade}`, undefined, {
      module: 'GrupoController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.grupoService.findByPropriedade(id_propriedade, paginationDto, user);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Busca um grupo específico',
    description: 'Retorna os dados de um grupo específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do grupo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Grupo encontrado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('GET', `/grupos/${id}`, undefined, { module: 'GrupoController', method: 'findOne', grupoId: id });
    return this.grupoService.findOne(id, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um novo grupo',
    description: 'Cria um novo registro de grupo no banco de dados. Retorna o grupo completo com o ID gerado.',
  })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createGrupoDto: CreateGrupoDto, @User() user: any) {
    this.logger.logApiRequest('POST', '/grupos', undefined, { module: 'GrupoController', method: 'create' });
    return this.grupoService.create(createGrupoDto, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um grupo',
    description: 'Atualiza os dados de um grupo específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do grupo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Grupo atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateGrupoDto: UpdateGrupoDto, @User() user: any) {
    this.logger.logApiRequest('PATCH', `/grupos/${id}`, undefined, { module: 'GrupoController', method: 'update', grupoId: id });
    return this.grupoService.update(id, updateGrupoDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover grupo (soft delete)',
    description: 'Remove logicamente um grupo. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id', description: 'ID do grupo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Grupo removido com sucesso (soft delete).' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('DELETE', `/grupos/${id}`, undefined, { module: 'GrupoController', method: 'remove', grupoId: id });
    return this.grupoService.remove(id, user);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar grupo removido',
    description: 'Restaura um grupo que foi removido (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do grupo a ser restaurado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Grupo restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado.' })
  @ApiResponse({ status: 400, description: 'Grupo não está removido.' })
  restore(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('POST', `/grupos/${id}/restore`, undefined, { module: 'GrupoController', method: 'restore', grupoId: id });
    return this.grupoService.restore(id, user);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todos os grupos incluindo removidos',
    description: 'Retorna todos os grupos, incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted(@User() user: any) {
    this.logger.logApiRequest('GET', '/grupos/deleted/all', undefined, { module: 'GrupoController', method: 'findAllWithDeleted' });
    return this.grupoService.findAllWithDeleted(user);
  }
}
