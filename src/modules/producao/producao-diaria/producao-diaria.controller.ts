import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { ProducaoDiariaService } from './producao-diaria.service';
import { CreateProducaoDiariaDto, UpdateProducaoDiariaDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Produção Diária')
@Controller('producao-diaria')
export class ProducaoDiariaController {
  constructor(
    private readonly service: ProducaoDiariaService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '📦 Consolidar produção diária',
    description: `
**Quando usar:** No final do dia, após todas as ordenhas.

**O que faz:**
- Soma todo o leite produzido no dia
- Registra o estoque total disponível
- Atualiza quantidade disponível para coleta

**Pré-requisito:** Ter ordenhas registradas em \`POST /lactacao\`

**Próximo passo:** Aguardar coleta do laticínio (\`POST /coletas\`)
    `,
  })
  @ApiBody({ type: CreateProducaoDiariaDto })
  @ApiResponse({ status: 201, description: 'Estoque consolidado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateProducaoDiariaDto) {
    this.logger.logApiRequest('POST', '/estoque-leite', undefined, {
      module: 'EstoqueLeiteController',
      method: 'create',
      usuarioId: dto.id_usuario,
      propriedadeId: dto.id_propriedade,
    });
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: '📋 Listar todo o estoque',
    description: 'Lista histórico completo de estoque com paginação.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', '/producao-diaria', undefined, { module: 'ProducaoDiariaController', method: 'findAll' });
    return this.service.findAll(paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({
    summary: '🏠 Estoque por propriedade',
    description: `
**Use para:**
- Ver quanto leite está disponível
- Verificar produção dos últimos dias
- Planejar coletas
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', `/estoque-leite/propriedade/${id_propriedade}`, undefined, {
      module: 'EstoqueLeiteController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade, paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: '🔍 Buscar estoque específico',
    description: 'Retorna detalhes de um registro de estoque.',
  })
  @ApiParam({ name: 'id', description: 'ID do registro de estoque', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('GET', `/producao-diaria/${id}`, undefined, { module: 'ProducaoDiariaController', method: 'findOne', estoqueId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Atualizar estoque',
    description: 'Corrige dados de estoque (quantidade, data, etc).',
  })
  @ApiParam({ name: 'id', description: 'ID do registro a ser atualizado', type: 'string' })
  @ApiBody({ type: UpdateProducaoDiariaDto })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProducaoDiariaDto) {
    this.logger.logApiRequest('PATCH', `/producao-diaria/${id}`, undefined, { module: 'ProducaoDiariaController', method: 'update', estoqueId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover estoque (soft delete)',
    description: 'Remove logicamente um registro de estoque. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id', description: 'ID do registro a ser removido', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('DELETE', `/producao-diaria/${id}`, undefined, { module: 'ProducaoDiariaController', method: 'remove', estoqueId: id });
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar estoque removido',
    description: 'Restaura um registro de estoque que foi removido (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do registro a ser restaurado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  @ApiResponse({ status: 400, description: 'Registro não está removido.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('POST', `/estoque-leite/${id}/restore`, undefined, {
      module: 'EstoqueLeiteController',
      method: 'restore',
      estoqueId: id,
    });
    return this.service.restore(id);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todos os registros incluindo removidos',
    description: 'Retorna todos os registros de estoque, incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted() {
    this.logger.logApiRequest('GET', '/producao-diaria/deleted/all', undefined, { module: 'ProducaoDiariaController', method: 'findAllWithDeleted' });
    return this.service.findAllWithDeleted();
  }
}
