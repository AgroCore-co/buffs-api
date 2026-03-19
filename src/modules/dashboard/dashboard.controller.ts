import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { PropertyExistsGuard } from '../../core/guards/property-exists.guard';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto, DashboardLactacaoDto, DashboardProducaoMensalDto, DashboardReproducaoDto } from './dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, PropertyExistsGuard)
@ApiTags('Dashboard')
@Controller('dashboard')
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('lactacao/:id_propriedade')
  @CacheTTL(300) // 5 minutos
  @ApiOperation({
    summary: 'Obter métricas de lactação por ciclo de uma propriedade',
    description: 'Retorna ciclos de lactação de todas as bufalas fêmeas com classificação (Ótima, Boa, Mediana, Ruim) (Cache: 5min)',
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade (UUID)',
    type: 'string',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiQuery({
    name: 'ano',
    description: 'Ano de referência (padrão: ano atual)',
    required: false,
    type: Number,
    example: 2025,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de lactação retornadas com sucesso.',
    type: DashboardLactacaoDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  async getLactacaoMetricas(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
  ): Promise<DashboardLactacaoDto> {
    const anoRef = ano ?? new Date().getFullYear();
    return this.dashboardService.getLactacaoMetricas(id_propriedade, anoRef);
  }

  @Get('producao-mensal/:id_propriedade')
  @CacheTTL(600) // 10 minutos
  @ApiOperation({
    summary: 'Obter métricas de produção mensal de leite',
    description: 'Retorna produção total mensal, comparativo com mês anterior e série histórica anual (Cache: 10min)',
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade (UUID)',
    type: 'string',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiQuery({
    name: 'ano',
    description: 'Ano de referência (padrão: ano atual)',
    required: false,
    type: Number,
    example: 2025,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de produção mensal retornadas com sucesso.',
    type: DashboardProducaoMensalDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  async getProducaoMensal(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
  ): Promise<DashboardProducaoMensalDto> {
    const anoRef = ano ?? new Date().getFullYear();
    return this.dashboardService.getProducaoMensal(id_propriedade, anoRef);
  }

  @Get('reproducao/:id_propriedade')
  @ApiOperation({
    summary: 'Obter métricas de reprodução de uma propriedade',
    description: 'Retorna totais de reproduções por status (Em andamento, Confirmada, Falha) e data da última reprodução',
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade (UUID)',
    type: 'string',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de reprodução retornadas com sucesso.',
    type: DashboardReproducaoDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  async getReproducaoMetricas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string): Promise<DashboardReproducaoDto> {
    return this.dashboardService.getReproducaoMetricas(id_propriedade);
  }

  @Get(':id_propriedade')
  @CacheTTL(300) // 5 minutos
  @ApiOperation({
    summary: 'Obter estatísticas do dashboard para uma propriedade',
    description: 'Retorna estatísticas completas de uma propriedade específica incluindo contagens de animais, lotes e usuários (Cache: 5min)',
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade (UUID)',
    type: 'string',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso.',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  async getStats(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(id_propriedade);
  }
}
