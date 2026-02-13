import { Controller, Get, Param, Query, ParseIntPipe, ParseUUIDPipe, ParseFloatPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { GenealogiaService } from './genealogia.service';
import { GenealogiaIAService } from './genealogia-ia.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { GenealogiaNodeDto, AnaliseGenealogicaDto, MachosCompativeisDto } from './dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('IA - Genealogia')
@Controller('reproducao/genealogia')
@UseInterceptors(CacheInterceptor)
export class GenealogiaController {
  constructor(
    private readonly genealogiaService: GenealogiaService,
    private readonly genealogiaIAService: GenealogiaIAService,
  ) {}

  @Get(':id')
  @CacheTTL(300) // 5 minutos
  @ApiOperation({ summary: 'Obter a árvore genealógica de um búfalo (Cache: 5min)' })
  @ApiParam({ name: 'id', description: 'ID do búfalo', type: 'string' })
  @ApiQuery({ name: 'geracoes', description: 'Número de gerações a serem exibidas', required: false, type: 'number', example: 3 })
  @ApiResponse({ status: 200, description: 'Árvore genealógica retornada com sucesso.', type: GenealogiaNodeDto })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  async findGenealogia(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: any,
    @Query('geracoes', new ParseIntPipe({ optional: true })) geracoes?: number,
  ): Promise<GenealogiaNodeDto | null> {
    const profundidade = geracoes || 3;
    return this.genealogiaService.buildTree(id, profundidade, user);
  }

  @Get(':id/analise')
  @CacheTTL(600) // 10 minutos
  @ApiOperation({
    summary: 'Análise genealógica completa com cálculo de consanguinidade (Cache: 10min)',
    description: 'Calcula o coeficiente de consanguinidade, identifica ancestrais comuns e avalia risco genético',
  })
  @ApiParam({ name: 'id', description: 'ID do búfalo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Análise concluída com sucesso.', type: AnaliseGenealogicaDto })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  @ApiResponse({ status: 503, description: 'Serviço de IA temporariamente indisponível.' })
  async analisarConsanguinidade(@Param('id', ParseUUIDPipe) id: string, @User() user: any): Promise<AnaliseGenealogicaDto> {
    // Verifica acesso antes de chamar a IA
    await this.genealogiaService.buildTree(id, 1, user);

    return this.genealogiaIAService.analisarGenealogiaCompleta(id, user.sub);
  }

  @Get('machos-compativeis/:femeaId')
  @CacheTTL(300) // 5 minutos
  @ApiOperation({
    summary: 'Encontrar machos compatíveis para acasalamento (Cache: 5min)',
    description: 'Lista machos compatíveis baseados no limite de consanguinidade aceitável',
  })
  @ApiParam({ name: 'femeaId', description: 'ID da fêmea', type: 'string' })
  @ApiQuery({
    name: 'maxConsanguinidade',
    description: 'Consanguinidade máxima aceitável em %',
    required: false,
    type: 'number',
    example: 6.25,
  })
  @ApiResponse({ status: 200, description: 'Machos compatíveis encontrados.', type: MachosCompativeisDto })
  @ApiResponse({ status: 404, description: 'Fêmea não encontrada.' })
  @ApiResponse({ status: 400, description: 'Búfalo informado não é uma fêmea.' })
  @ApiResponse({ status: 503, description: 'Serviço de IA temporariamente indisponível.' })
  async encontrarMachosCompativeis(
    @Param('femeaId', ParseUUIDPipe) femeaId: string,
    @User() user: any,
    @Query('maxConsanguinidade', new ParseFloatPipe({ optional: true })) maxConsanguinidade?: number,
  ): Promise<MachosCompativeisDto> {
    // Verifica acesso antes de chamar a IA
    await this.genealogiaService.buildTree(femeaId, 1, user);

    return this.genealogiaIAService.encontrarMachosCompativeis(femeaId, maxConsanguinidade || 6.25, user.sub);
  }
}
