import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { VacinacaoService } from './vacinacao.service';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Vacinação')
@Controller('vacinacao')
export class VacinacaoController {
  constructor(private readonly service: VacinacaoService) {}

  // Rota aninhada para criar uma vacinação para um búfalo específico
  @Post('/bufalo/:id_bufalo')
  @ApiOperation({ summary: 'Cria um registo de vacinação para um búfalo' })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo que recebeu a vacina', type: 'string' })
  @ApiResponse({ status: 201, description: 'Registo criado com sucesso.' })
  create(@Param('id_bufalo', ParseUUIDPipe) id_bufalo: string, @Body() dto: CreateVacinacaoDto, @User('sub') auth_uuid: string) {
    return this.service.create(dto, id_bufalo, auth_uuid);
  }

  // Rota aninhada para listar todas as vacinas de um búfalo
  @Get('/bufalo/:id_bufalo')
  @ApiOperation({ summary: 'Lista todos os registos de vacinação de um búfalo' })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo a ser consultado', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAllByBufalo(@Param('id_bufalo', ParseUUIDPipe) id_bufalo: string, @Query() paginationDto: PaginationDto) {
    return this.service.findAllByBufalo(id_bufalo, paginationDto);
  }

  // Rota específica para buscar apenas vacinas (IDs específicos)
  @Get('/bufalo/:id_bufalo/vacinas')
  @ApiOperation({ summary: 'Lista apenas vacinas específicas de um búfalo' })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo a ser consultado', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de vacinas retornada com sucesso.' })
  findVacinasByBufalo(@Param('id_bufalo', ParseUUIDPipe) id_bufalo: string, @Query() paginationDto: PaginationDto) {
    return this.service.findVacinasByBufaloId(id_bufalo, paginationDto);
  }

  // Rotas diretas para um registo de vacinação específico
  @Get(':id')
  @ApiOperation({ summary: 'Busca um registo de vacinação pelo seu ID' })
  @ApiParam({ name: 'id', description: 'ID do registo de vacinação', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registo encontrado.' })
  @ApiResponse({ status: 404, description: 'Registo não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registo de vacinação' })
  @ApiParam({ name: 'id', description: 'ID do registo a ser atualizado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registo não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVacinacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover registo de vacinação (soft delete)',
    description: 'Remove logicamente um registo de vacinação. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id', description: 'ID do registo a ser removido', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registo removido com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Registo não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar registo de vacinação removido',
    description: 'Restaura um registo de vacinação que foi removido (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do registo a ser restaurado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registo restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registo não encontrado.' })
  @ApiResponse({ status: 400, description: 'Registo não está removido.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todos os registos de vacinação incluindo removidos',
    description: 'Retorna todos os registos de vacinação, incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted() {
    return this.service.findAllWithDeleted();
  }
}
