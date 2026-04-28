import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query, ParseBoolPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { DadosSanitariosService } from './dados-sanitarios.service';
import { CreateDadosSanitariosDto, UpdateDadosSanitariosDto, FrequenciaDoencasResponseDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { PropertyExistsGuard } from '../../../core/guards/property-exists.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Dados Sanitários')
@Controller('dados-sanitarios')
export class DadosSanitariosController {
  constructor(
    private readonly service: DadosSanitariosService,
    private readonly authHelperService: AuthHelperService,
  ) {}

  private async resolveUserId(user: { email?: string }): Promise<string> {
    return this.authHelperService.getUserId(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um novo registro sanitário',
    description: `
      Cria um novo registro sanitário. O nome da doença será automaticamente 
      normalizado e corrigido se houver erros de digitação conhecidos.
      
      Exemplos de correção automática:
      - "Verminose" → "verminose"
      - "vverminose" → "verminose"
      - "mastiti" → "mastite"
    `,
  })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  create(@Body() dto: CreateDadosSanitariosDto, @User('sub') id_usuario: string) {
    return this.service.create(dto, id_usuario);
  }

  @Get('doencas/sugestoes')
  @ApiOperation({
    summary: 'Retorna sugestões de nomes de doenças',
    description: `
      Útil para autocomplete no frontend. Retorna doenças similares ao termo pesquisado.
      Se nenhum termo for fornecido, retorna as doenças mais comuns.
    `,
  })
  @ApiQuery({
    name: 'termo',
    required: false,
    type: String,
    description: 'Termo de busca parcial',
    example: 'verm',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de sugestões (padrão: 5)',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sugestões retornada com sucesso.',
    schema: {
      example: ['verminose', 'verminos', 'verme'],
    },
  })
  getSugestoesDoencas(@Query('termo') termo?: string, @Query('limit', new DefaultValuePipe(5)) limit?: number) {
    return this.service.getSugestoesDoencas(termo, limit);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os registros sanitários com paginação',
    description: 'Retorna registros ordenados por data de aplicação (mais recentes primeiro)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (começa em 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de itens por página (máximo 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.service.findAll(paginationDto);
  }

  @Get('bufalo/:id_bufalo')
  @ApiOperation({
    summary: 'Busca todos os registros sanitários de um búfalo específico com paginação',
    description: 'Retorna registros ordenados por data de aplicação (mais recentes primeiro)',
  })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (começa em 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de itens por página (máximo 100)' })
  @ApiResponse({ status: 200, description: 'Registros encontrados.' })
  @ApiResponse({ status: 404, description: 'Nenhum registro encontrado para este búfalo.' })
  findByBufalo(@Param('id_bufalo', ParseUUIDPipe) id_bufalo: string, @Query() paginationDto: PaginationDto) {
    return this.service.findByBufalo(id_bufalo, paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Busca todos os registros sanitários de uma propriedade com paginação',
    description:
      'Retorna todos os registros sanitários dos búfalos de uma propriedade específica, ordenados por data de aplicação (mais recentes primeiro)',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (começa em 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de itens por página (máximo 100)' })
  @ApiResponse({ status: 200, description: 'Registros encontrados.' })
  @UseGuards(PropertyExistsGuard)
  async findByPropriedade(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query() paginationDto: PaginationDto,
    @User() user: { email?: string },
  ) {
    const userId = await this.resolveUserId(user);
    return this.service.findByPropriedade(id_propriedade, paginationDto, userId);
  }

  @Get('propriedade/:id_propriedade/frequencia-doencas')
  @ApiOperation({
    summary: 'Retorna a frequência de doenças registradas na propriedade',
    description: `
      Analisa todos os registros sanitários da propriedade e retorna a frequência 
      de cada doença registrada. Os nomes das doenças são normalizados (lowercase) 
      para evitar duplicatas por diferença de capitalização.
      
      Ordenado por frequência (mais comum primeiro).
      
      OPCIONAL: Pode agrupar doenças com nomes similares (ex: erros de digitação) 
      usando o parâmetro 'agruparSimilares=true'.
    `,
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade',
    type: 'string',
  })
  @ApiQuery({
    name: 'agruparSimilares',
    required: false,
    type: Boolean,
    description: 'Se true, agrupa doenças com nomes similares (detecta erros de digitação)',
    example: false,
  })
  @ApiQuery({
    name: 'limiarSimilaridade',
    required: false,
    type: Number,
    description: 'Limiar de similaridade para agrupamento (0-1). Quanto maior, mais restritivo. Padrão: 0.8',
    example: 0.8,
  })
  @ApiResponse({
    status: 200,
    description: 'Frequência de doenças retornada com sucesso.',
    type: FrequenciaDoencasResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @UseGuards(PropertyExistsGuard)
  async getFrequenciaDoencas(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('agruparSimilares', new DefaultValuePipe(false), ParseBoolPipe) agruparSimilares: boolean,
    @Query('limiarSimilaridade', new DefaultValuePipe(0.8)) limiarSimilaridade: number,
    @User() user: { email?: string },
  ): Promise<FrequenciaDoencasResponseDto> {
    const userId = await this.resolveUserId(user);
    return this.service.getFrequenciaDoencas(id_propriedade, agruparSimilares, limiarSimilaridade, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro sanitário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro sanitário', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('migrar-doencas')
  @ApiOperation({
    summary: '[ADMIN] Normaliza todas as doenças existentes',
    description: `
      **ATENÇÃO: Execute este endpoint UMA VEZ após implementar a normalização automática.**
      
      Atualiza todos os registros existentes aplicando a normalização automática de doenças.
      
      Exemplos de normalização:
      - "Verminose" → "verminose"
      - "vverminose" → "verminose"
      - "MASTITE" → "mastite"
      - "mastiti" → "mastite"
      
      Após executar, você pode deletar este endpoint do código.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Doenças normalizadas com sucesso',
    schema: {
      example: {
        message: 'Migração concluída',
        total: 8,
        atualizados: 5,
        sem_alteracao: 3,
        detalhes: [
          { id: 'uuid-1', de: 'Verminose', para: 'verminose' },
          { id: 'uuid-2', de: 'vverminose', para: 'verminose' },
        ],
      },
    },
  })
  migrarDoencas() {
    return this.service.migrarNormalizacaoDoencas();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro sanitário' })
  @ApiParam({ name: 'id', description: 'ID do registro sanitário a ser atualizado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDadosSanitariosDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover registro sanitário (soft delete)',
    description: 'Remove logicamente um registro sanitário. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id', description: 'ID do registro sanitário a ser removido', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar registro sanitário removido',
    description: 'Restaura um registro sanitário que foi removido (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do registro a ser restaurado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  @ApiResponse({ status: 400, description: 'Registro não está removido.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todos os registros sanitários incluindo removidos',
    description: 'Retorna todos os registros sanitários, incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted() {
    return this.service.findAllWithDeleted();
  }
}
