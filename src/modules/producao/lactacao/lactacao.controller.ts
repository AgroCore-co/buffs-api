import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { LactacaoService } from './lactacao.service';
import { CreateCicloLactacaoDto, UpdateCicloLactacaoDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Lactação')
@Controller('lactacao')
export class LactacaoController {
  constructor(
    private readonly service: LactacaoService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '🆕 Iniciar novo ciclo de lactação',
    description: `
**Quando usar:** Logo após a búfala parir.

**O que faz:** 
- Marca o início do período de produção de leite
- Define a data do parto como início do ciclo
- Ativa a búfala para ordenhas (Controle Leiteiro)

**Próximo passo:** Começar a registrar ordenhas em \`POST /lactacao\`
    `,
  })
  @ApiBody({ type: CreateCicloLactacaoDto })
  @ApiResponse({ status: 201, description: 'Ciclo criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateCicloLactacaoDto) {
    this.logger.logApiRequest('POST', '/lactacao', undefined, {
      module: 'LactacaoController',
      method: 'create',
      bufalaId: dto.idBufala,
    });
    return this.service.create(dto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({
    summary: '📋 Listar todos os ciclos',
    description: 'Lista todos os ciclos de lactação (ativos e encerrados) com paginação.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', '/lactacao', undefined, { module: 'LactacaoController', method: 'findAll' });
    return this.service.findAll(paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({
    summary: '🏠 Listar ciclos por propriedade',
    description: 'Lista todos os ciclos de lactação de uma propriedade específica.',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', `/lactacao/propriedade/${id_propriedade}`, undefined, {
      module: 'LactacaoController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade, paginationDto);
  }

  @Get('propriedade/:id_propriedade/estatisticas')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({
    summary: '📊 Estatísticas dos ciclos',
    description: `
**Retorna:**
- Total de ciclos ativos
- Total de ciclos encerrados
- Média de duração dos ciclos
- Produção total por ciclo
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso.' })
  getEstatisticas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string) {
    this.logger.logApiRequest('GET', `/lactacao/propriedade/${id_propriedade}/estatisticas`, undefined, {
      module: 'LactacaoController',
      method: 'getEstatisticas',
      propriedadeId: id_propriedade,
    });
    return this.service.getEstatisticasPropriedade(id_propriedade);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({
    summary: '🔍 Buscar ciclo específico',
    description: 'Retorna detalhes completos de um ciclo de lactação.',
  })
  @ApiParam({ name: 'id', description: 'ID do ciclo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ciclo encontrado.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('GET', `/lactacao/${id}`, undefined, { module: 'LactacaoController', method: 'findOne', cicloId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Atualizar ciclo',
    description: 'Atualiza informações do ciclo (ex: encerrar ciclo definindo data_fim).',
  })
  @ApiParam({ name: 'id', description: 'ID do ciclo a ser atualizado', type: 'string' })
  @ApiBody({ type: UpdateCicloLactacaoDto })
  @ApiResponse({ status: 200, description: 'Ciclo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCicloLactacaoDto) {
    this.logger.logApiRequest('PATCH', `/lactacao/${id}`, undefined, { module: 'LactacaoController', method: 'update', cicloId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover ciclo (soft delete)',
    description: 'Remove logicamente um ciclo de lactação sem deletar do banco. Use POST /:id/restore para recuperar.',
  })
  @ApiParam({ name: 'id', description: 'ID do ciclo a ser removido', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ciclo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('DELETE', `/lactacao/${id}`, undefined, { module: 'LactacaoController', method: 'remove', cicloId: id });
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar ciclo removido',
    description: 'Restaura um ciclo de lactação que foi removido com soft delete.',
  })
  @ApiParam({ name: 'id', description: 'ID do ciclo a ser restaurado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ciclo restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado ou não estava removido.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('POST', `/lactacao/${id}/restore`, undefined, {
      module: 'LactacaoController',
      method: 'restore',
      cicloId: id,
    });
    return this.service.restore(id);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar ciclos removidos',
    description: 'Lista todos os ciclos de lactação incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista de ciclos incluindo deletados retornada com sucesso.' })
  findAllWithDeleted() {
    this.logger.logApiRequest('GET', '/lactacao/deleted/all', undefined, {
      module: 'LactacaoController',
      method: 'findAllWithDeleted',
    });
    return this.service.findAllWithDeleted();
  }
}
