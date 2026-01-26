import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseUUIDPipe, HttpCode } from '@nestjs/common';
import { LoteService } from './lote.service';
import { CreateLoteDto, UpdateLoteDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { Cargo } from '../../usuario/enums/cargo.enum';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Cargo.PROPRIETARIO)
@ApiTags('Gestão de Propriedade - Lotes (Piquetes)')
@Controller('lotes')
export class LoteController {
  constructor(private readonly loteService: LoteService) {}

  @Get('propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Lista todos os lotes de uma propriedade específica',
    description: 'Retorna lista de lotes com geometria PostGIS. O campo geo_mapa vem como objeto (GeoJSON parseado).',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lista de lotes da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence ao usuário.' })
  findAllByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: any) {
    return this.loteService.findAllByPropriedade(id_propriedade, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um novo lote (piquete) com dados geográficos',
    description: 'Cria lote com geometria PostGIS. Envie geo_mapa como string (JSON.stringify), receba como objeto.',
  })
  @ApiResponse({ status: 201, description: 'Lote criado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence ao usuário.' })
  create(@Body() createLoteDto: CreateLoteDto, @User() user: any) {
    return this.loteService.create(createLoteDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um lote específico' })
  @ApiParam({ name: 'id', description: 'ID do lote (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lote encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado ou não pertence ao usuário.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.loteService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um lote',
    description: 'Atualiza dados do lote, incluindo geometria. Envie geo_mapa como string, receba como objeto.',
  })
  @ApiParam({ name: 'id', description: 'ID do lote (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lote atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado ou não pertence ao usuário.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateLoteDto: UpdateLoteDto, @User() user: any) {
    return this.loteService.update(id, updateLoteDto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um lote' })
  @ApiParam({ name: 'id', description: 'ID do lote (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Lote removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado ou não pertence ao usuário.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.loteService.remove(id, user);
  }
}
