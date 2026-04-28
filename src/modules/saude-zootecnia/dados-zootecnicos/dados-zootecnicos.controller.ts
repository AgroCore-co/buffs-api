import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { DadosZootecnicosService } from './dados-zootecnicos.service';
import { CreateDadoZootecnicoDto, UpdateDadoZootecnicoDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { PropertyExistsGuard } from '../../../core/guards/property-exists.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Dados Zootécnicos')
@Controller('dados-zootecnicos')
export class DadosZootecnicosController {
  constructor(
    private readonly service: DadosZootecnicosService,
    private readonly authHelperService: AuthHelperService,
  ) {}

  private async resolveUserId(user: { email?: string }): Promise<string> {
    return this.authHelperService.getUserId(user);
  }

  // --- ROTAS ANINHADAS SOB UM BÚFALO ---

  @Post('/bufalo/:id_bufalo')
  @ApiOperation({
    summary: 'Cria um registro zootécnico para um búfalo específico',
    description: 'Adiciona um novo registro de métrica (peso, altura, etc.) para um búfalo, associado ao usuário logado.',
  })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo ao qual o registro pertence', type: 'string' })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  create(
    @Param('id_bufalo', ParseUUIDPipe) id_bufalo: string,
    @User() user: any, // <-- CORRIGIDO: Recebe o objeto 'user' completo
    @Body() dto: CreateDadoZootecnicoDto,
  ) {
    // CORRIGIDO: Extraímos o 'sub' (ID do usuário) do objeto de usuário injetado
    const id_usuario_logado = user.sub;

    // Passamos o ID (UUID) correto para o serviço
    return this.service.create(dto, id_bufalo, id_usuario_logado);
  }

  @Get('/bufalo/:id_bufalo')
  @ApiOperation({
    summary: 'Lista todos os registros zootécnicos de um búfalo com paginação',
    description: 'Retorna o histórico completo de dados zootécnicos para um búfalo específico.',
  })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo para consultar os registros', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAllByBufalo(@Param('id_bufalo', ParseUUIDPipe) id_bufalo: string, @Query() paginationDto: PaginationDto) {
    return this.service.findAllByBufalo(id_bufalo, paginationDto);
  }

  @Get('/propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Lista todos os registros zootécnicos de uma propriedade com paginação',
    description: 'Retorna o histórico completo de dados zootécnicos para todos os búfalos de uma propriedade específica.',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade para consultar os registros', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  @UseGuards(PropertyExistsGuard)
  async findAllByPropriedade(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query() paginationDto: PaginationDto,
    @User() user: { email?: string },
  ) {
    const userId = await this.resolveUserId(user);
    return this.service.findAllByPropriedade(id_propriedade, paginationDto, userId);
  }

  // --- ROTAS DIRETAS PARA UM REGISTRO ESPECÍFICO ---

  @Get(':id_zootec')
  @ApiOperation({
    summary: 'Busca um registro zootécnico único pelo seu ID',
    description: 'Retorna um registro zootécnico específico.',
  })
  @ApiParam({ name: 'id_zootec', description: 'ID do registro zootécnico', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id_zootec', ParseUUIDPipe) id_zootec: string) {
    return this.service.findOne(id_zootec);
  }

  @Patch(':id_zootec')
  @ApiOperation({ summary: 'Atualiza um registro zootécnico' })
  @ApiParam({ name: 'id_zootec', description: 'ID do registro zootécnico a ser atualizado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id_zootec', ParseUUIDPipe) id_zootec: string, @Body() dto: UpdateDadoZootecnicoDto) {
    return this.service.update(id_zootec, dto);
  }

  @Delete(':id_zootec')
  @ApiOperation({
    summary: 'Remover registro zootécnico (soft delete)',
    description: 'Remove logicamente um registro zootécnico. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id_zootec', description: 'ID do registro zootécnico a ser removido', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id_zootec', ParseUUIDPipe) id_zootec: string) {
    return this.service.remove(id_zootec);
  }

  @Post(':id_zootec/restore')
  @ApiOperation({
    summary: 'Restaurar registro zootécnico removido',
    description: 'Restaura um registro zootécnico que foi removido (soft delete).',
  })
  @ApiParam({ name: 'id_zootec', description: 'ID do registro a ser restaurado', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  @ApiResponse({ status: 400, description: 'Registro não está removido.' })
  restore(@Param('id_zootec', ParseUUIDPipe) id_zootec: string) {
    return this.service.restore(id_zootec);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todos os registros zootécnicos incluindo removidos',
    description: 'Retorna todos os registros zootécnicos, incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted() {
    return this.service.findAllWithDeleted();
  }
}
