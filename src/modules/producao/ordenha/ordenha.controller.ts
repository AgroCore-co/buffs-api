import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { OrdenhaService } from './ordenha.service';
import { CreateDadosLactacaoDto, UpdateDadosLactacaoDto, FemeaEmLactacaoDto, ResumoProducaoBufalaDto } from './dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Ordenha')
@Controller('ordenhas')
export class OrdenhaController {
  constructor(
    private readonly service: OrdenhaService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '🥛 Registrar ordenha individual',
    description: `
**Quando usar:** A cada ordenha realizada (2-3x por dia).

**O que registra:**
- Quantidade de leite produzida por búfala
- Horário da ordenha
- Período (manhã, tarde, noite)
- Qualidade do leite (opcional)

**Pré-requisito:** Búfala deve ter um ciclo de lactação ATIVO.

**Próximo passo:** No fim do dia, consolidar em \`POST /producao-diaria\`
    `,
  })
  @ApiResponse({ status: 201, description: 'Ordenha registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou búfala não está em lactação.' })
  create(@Body() dto: CreateDadosLactacaoDto, @User() user: any) {
    this.logger.logApiRequest('POST', '/ordenhas', undefined, { module: 'OrdenhaController', method: 'create', bufalaId: dto.idBufala });
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: '📋 Listar todas as ordenhas',
    description: 'Lista histórico completo de ordenhas com paginação.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    this.logger.logApiRequest('GET', '/ordenhas', undefined, {
      module: 'OrdenhaController',
      method: 'findAll',
      page: Number(page),
      limit: Number(limit),
    });
    return this.service.findAll(Number(page), Number(limit));
  }

  @Get('bufala/:id_bufala')
  @ApiOperation({
    summary: '🐃 Histórico de ordenhas por búfala',
    description: 'Lista todas as ordenhas de uma búfala específica.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  findAllByBufala(
    @Param('id_bufala', ParseUUIDPipe) id_bufala: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @User() user: any,
  ) {
    this.logger.logApiRequest('GET', `/ordenhas/bufala/${id_bufala}`, undefined, {
      module: 'OrdenhaController',
      method: 'findAllByBufala',
      bufalaId: id_bufala,
      page: Number(page),
      limit: Number(limit),
    });
    return this.service.findAllByBufala(id_bufala, Number(page), Number(limit), user);
  }

  @Get('ciclo/:id_ciclo_lactacao')
  @ApiOperation({
    summary: '🔄 Ordenhas por ciclo de lactação',
    description: 'Lista todas as ordenhas de um ciclo específico.',
  })
  @ApiParam({ name: 'id_ciclo_lactacao', description: 'ID do ciclo de lactação', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  findAllByCiclo(
    @Param('id_ciclo_lactacao', ParseUUIDPipe) id_ciclo_lactacao: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @User() user: any,
  ) {
    this.logger.logApiRequest('GET', `/ordenhas/ciclo/${id_ciclo_lactacao}`, undefined, {
      module: 'OrdenhaController',
      method: 'findAllByCiclo',
      cicloId: id_ciclo_lactacao,
      page: Number(page),
      limit: Number(limit),
    });
    return this.service.findAllByCiclo(id_ciclo_lactacao, Number(page), Number(limit), user);
  }

  @Get(':id')
  @ApiOperation({
    summary: '🔍 Buscar ordenha específica',
    description: 'Retorna detalhes de uma ordenha pelo ID.',
  })
  @ApiResponse({ status: 200, description: 'Dados do registro retornados.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('GET', `/ordenhas/${id}`, undefined, { module: 'OrdenhaController', method: 'findOne', lactacaoId: id });
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Atualizar ordenha',
    description: 'Corrige dados de uma ordenha registrada (quantidade, horário, etc).',
  })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDadosLactacaoDto, @User() user: any) {
    this.logger.logApiRequest('PATCH', `/ordenhas/${id}`, undefined, { module: 'OrdenhaController', method: 'update', lactacaoId: id });
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover ordenha (soft delete)',
    description: 'Remove logicamente um registro de ordenha. Use POST /:id/restore para restaurar.',
  })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('DELETE', `/ordenhas/${id}`, undefined, { module: 'OrdenhaController', method: 'remove', lactacaoId: id });
    return this.service.remove(id, user);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar ordenha removida',
    description: 'Restaura um registro de ordenha que foi removido (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do registro a ser restaurado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  @ApiResponse({ status: 400, description: 'Registro não está removido.' })
  restore(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('POST', `/ordenhas/${id}/restore`, undefined, {
      module: 'OrdenhaController',
      method: 'restore',
      lactacaoId: id,
    });
    return this.service.restore(id, user);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todas as ordenhas incluindo removidas',
    description: 'Retorna todos os registros de ordenha, incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted(@User() user: any) {
    this.logger.logApiRequest('GET', '/ordenhas/deleted/all', undefined, { module: 'OrdenhaController', method: 'findAllWithDeleted' });
    return this.service.findAllWithDeleted(user);
  }

  @Get('femeas/em-lactacao/:id_propriedade')
  @ApiOperation({
    summary: '📋 Listar búfalas disponíveis para ordenha',
    description: `
**Retorna:** Todas as búfalas com ciclo de lactação ATIVO, incluindo classificação de produção.

**Classificação baseada na média do rebanho:**
- **Ótima**: produção >= 120% da média
- **Boa**: produção >= média
- **Mediana**: produção >= 80% da média  
- **Ruim**: produção < 80% da média

**Use antes de:** Registrar uma nova ordenha para ver quais búfalas podem ser ordenhadas.
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Fêmeas em lactação com dados de produção e classificação', type: [FemeaEmLactacaoDto] })
  async getFemeasEmLactacao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string): Promise<FemeaEmLactacaoDto[]> {
    this.logger.logApiRequest('GET', `/ordenhas/femeas/em-lactacao/${id_propriedade}`, undefined, {
      module: 'OrdenhaController',
      method: 'getFemeasEmLactacao',
      propriedadeId: id_propriedade,
    });
    return this.service.findFemeasEmLactacao(id_propriedade);
  }

  @Get('bufala/:id/resumo-producao')
  @ApiOperation({
    summary: '📊 Resumo de produção por búfala',
    description: `
**Retorna:**
- Dados do ciclo atual
- Produção total do ciclo
- Média diária de produção
- Histórico de ciclos anteriores
    `,
  })
  @ApiParam({ name: 'id', description: 'ID da búfala', type: 'string' })
  @ApiResponse({ status: 200, description: 'Resumo completo de produção', type: ResumoProducaoBufalaDto })
  async getResumoProducaoBufala(@Param('id', ParseUUIDPipe) id: string, @User() user: any): Promise<ResumoProducaoBufalaDto> {
    this.logger.logApiRequest('GET', `/ordenhas/bufala/${id}/resumo-producao`, undefined, {
      module: 'OrdenhaController',
      method: 'getResumoProducaoBufala',
      bufalaId: id,
    });
    return this.service.getResumoProducaoBufala(id, user);
  }
}
