import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../auth/decorators/user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { SyncPaginationDto } from './dto';
import { SyncService } from './sync.service';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('bufalos')
  @ApiOperation({ summary: 'Sincroniza bufalos por propriedade (offline-first)' })
  getBufalos(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getBufalos(propriedadeId, user, updatedAt);
  }

  @Get('lactacao/ciclos')
  @ApiOperation({ summary: 'Sincroniza ciclos de lactacao por propriedade (offline-first)' })
  getCiclosLactacao(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getCiclosLactacao(propriedadeId, user, updatedAt);
  }

  @Get('sanitario/eventos')
  @ApiOperation({ summary: 'Sincroniza eventos sanitarios por propriedade (offline-first)' })
  getEventosSanitarios(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getEventosSanitarios(propriedadeId, user, updatedAt);
  }

  @Get('reproducao')
  @ApiOperation({ summary: 'Sincroniza reproducao por propriedade (offline-first)' })
  getReproducao(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getReproducao(propriedadeId, user, updatedAt);
  }

  @Get('zootecnico/pesagens')
  @ApiOperation({ summary: 'Sincroniza pesagens zootecnicas por propriedade (offline-first)' })
  getPesagens(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getPesagens(propriedadeId, user, updatedAt);
  }

  @Get('grupos')
  @ApiOperation({ summary: 'Sincroniza grupos por propriedade (offline-first)' })
  getGrupos(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getGrupos(propriedadeId, user, updatedAt);
  }

  @Get('alertas')
  @ApiOperation({ summary: 'Sincroniza alertas por propriedade (offline-first)' })
  getAlertas(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getAlertas(propriedadeId, user, updatedAt);
  }

  @Get('racas')
  @ApiOperation({ summary: 'Sincroniza racas para uso offline (offline-first)' })
  getRacas(@Query('updated_at') updatedAt?: string) {
    return this.syncService.getRacas(updatedAt);
  }

  @Get('medicacoes')
  @ApiOperation({ summary: 'Sincroniza medicacoes por propriedade (offline-first)' })
  getMedicacoes(@Query('propriedadeId', ParseUUIDPipe) propriedadeId: string, @User() user: any, @Query('updated_at') updatedAt?: string) {
    return this.syncService.getMedicacoes(propriedadeId, user, updatedAt);
  }

  @Get(':id_propriedade/bufalos')
  @ApiOperation({ summary: 'Sincroniza bufalos por propriedade' })
  syncBufalos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncBufalos(id_propriedade, user, query);
  }

  @Get(':id_propriedade/lactacao')
  @ApiOperation({ summary: 'Sincroniza lactacao por propriedade' })
  syncLactacao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncLactacao(id_propriedade, user, query);
  }

  @Get(':id_propriedade/grupos')
  @ApiOperation({ summary: 'Sincroniza grupos por propriedade' })
  syncGrupos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncGrupos(id_propriedade, user, query);
  }

  @Get(':id_propriedade/racas')
  @ApiOperation({ summary: 'Sincroniza racas para uso offline' })
  syncRacas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncRacas(id_propriedade, user, query);
  }

  @Get(':id_propriedade/dados-zootecnicos')
  @ApiOperation({ summary: 'Sincroniza dados zootecnicos por propriedade' })
  syncDadosZootecnicos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDadosZootecnicos(id_propriedade, user, query);
  }

  @Get(':id_propriedade/medicamentos')
  @ApiOperation({ summary: 'Sincroniza medicamentos por propriedade' })
  syncMedicamentos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncMedicamentos(id_propriedade, user, query);
  }

  @Get(':id_propriedade/dados-sanitarios')
  @ApiOperation({ summary: 'Sincroniza dados sanitarios por propriedade' })
  syncDadosSanitarios(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDadosSanitarios(id_propriedade, user, query);
  }

  @Get(':id_propriedade/alertas')
  @ApiOperation({ summary: 'Sincroniza alertas por propriedade' })
  syncAlertas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncAlertas(id_propriedade, user, query);
  }

  @Get(':id_propriedade/coberturas')
  @ApiOperation({ summary: 'Sincroniza coberturas por propriedade' })
  syncCoberturas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncCoberturas(id_propriedade, user, query);
  }

  @Get(':id_propriedade/material-genetico')
  @ApiOperation({ summary: 'Sincroniza material genetico por propriedade' })
  syncMaterialGenetico(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncMaterialGenetico(id_propriedade, user, query);
  }

  @Get(':id_propriedade/dashboard/lactacao')
  @ApiOperation({ summary: 'Sincroniza dashboard de lactacao por propriedade' })
  syncDashboardLactacao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboardLactacao(id_propriedade, user, query);
  }

  @Get(':id_propriedade/dashboard/producao-mensal')
  @ApiOperation({ summary: 'Sincroniza dashboard de producao mensal por propriedade' })
  syncDashboardProducaoMensal(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboardProducaoMensal(id_propriedade, user, query);
  }

  @Get(':id_propriedade/dashboard/reproducao')
  @ApiOperation({ summary: 'Sincroniza dashboard de reproducao por propriedade' })
  syncDashboardReproducao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboardReproducao(id_propriedade, user, query);
  }

  @Get(':id_propriedade/dashboard')
  @ApiOperation({ summary: 'Sincroniza estatisticas gerais do dashboard por propriedade' })
  syncDashboard(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboard(id_propriedade, user, query);
  }
}
