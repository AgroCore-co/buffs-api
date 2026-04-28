import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PropertyExistsGuard } from '../../core/guards/property-exists.guard';
import { User } from '../auth/decorators/user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { SyncPaginationDto } from './dto';
import { SyncService } from './sync.service';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, PropertyExistsGuard)
@ApiTags('Sync')
@Controller('sync/:id_propriedade')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('bufalos')
  @ApiOperation({ summary: 'Sincroniza bufalos por propriedade' })
  syncBufalos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncBufalos(id_propriedade, user, query);
  }

  @Get('lactacao')
  @ApiOperation({ summary: 'Sincroniza lactacao por propriedade' })
  syncLactacao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncLactacao(id_propriedade, user, query);
  }

  @Get('grupos')
  @ApiOperation({ summary: 'Sincroniza grupos por propriedade' })
  syncGrupos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncGrupos(id_propriedade, user, query);
  }

  @Get('racas')
  @ApiOperation({ summary: 'Sincroniza racas para uso offline' })
  syncRacas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncRacas(id_propriedade, user, query);
  }

  @Get('dados-zootecnicos')
  @ApiOperation({ summary: 'Sincroniza dados zootecnicos por propriedade' })
  syncDadosZootecnicos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDadosZootecnicos(id_propriedade, user, query);
  }

  @Get('medicamentos')
  @ApiOperation({ summary: 'Sincroniza medicamentos por propriedade' })
  syncMedicamentos(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncMedicamentos(id_propriedade, user, query);
  }

  @Get('dados-sanitarios')
  @ApiOperation({ summary: 'Sincroniza dados sanitarios por propriedade' })
  syncDadosSanitarios(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDadosSanitarios(id_propriedade, user, query);
  }

  @Get('alertas')
  @ApiOperation({ summary: 'Sincroniza alertas por propriedade' })
  syncAlertas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncAlertas(id_propriedade, user, query);
  }

  @Get('coberturas')
  @ApiOperation({ summary: 'Sincroniza coberturas por propriedade' })
  syncCoberturas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncCoberturas(id_propriedade, user, query);
  }

  @Get('material-genetico')
  @ApiOperation({ summary: 'Sincroniza material genetico por propriedade' })
  syncMaterialGenetico(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncMaterialGenetico(id_propriedade, user, query);
  }

  @Get('dashboard/lactacao')
  @ApiOperation({ summary: 'Sincroniza dashboard de lactacao por propriedade' })
  syncDashboardLactacao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboardLactacao(id_propriedade, user, query);
  }

  @Get('dashboard/producao-mensal')
  @ApiOperation({ summary: 'Sincroniza dashboard de producao mensal por propriedade' })
  syncDashboardProducaoMensal(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboardProducaoMensal(id_propriedade, user, query);
  }

  @Get('dashboard/reproducao')
  @ApiOperation({ summary: 'Sincroniza dashboard de reproducao por propriedade' })
  syncDashboardReproducao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboardReproducao(id_propriedade, user, query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Sincroniza estatisticas gerais do dashboard por propriedade' })
  syncDashboard(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any, @Query() query: SyncPaginationDto) {
    return this.syncService.syncDashboard(id_propriedade, user, query);
  }
}
