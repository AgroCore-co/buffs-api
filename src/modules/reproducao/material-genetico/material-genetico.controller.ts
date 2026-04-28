import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { MaterialGeneticoService } from './material-genetico.service';
import { CreateMaterialGeneticoDto, UpdateMaterialGeneticoDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Reprodução - Material Genético')
@Controller('material-genetico')
export class MaterialGeneticoController {
  constructor(private readonly service: MaterialGeneticoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de material genético' })
  @ApiBody({ type: CreateMaterialGeneticoDto })
  @ApiResponse({ status: 201, description: 'Material genético criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateMaterialGeneticoDto, @User() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os materiais genéticos disponíveis com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de materiais retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto, @User() user: any) {
    return this.service.findAll(paginationDto, user);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista materiais genéticos por propriedade com paginação' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto, @User() user: any) {
    return this.service.findByPropriedade(id_propriedade, paginationDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar material genético por ID' })
  @ApiParam({ name: 'id', description: 'ID do material genético' })
  @ApiResponse({ status: 200, description: 'Material genético encontrado.' })
  @ApiResponse({ status: 404, description: 'Material genético não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar material genético' })
  @ApiParam({ name: 'id', description: 'ID do material genético' })
  @ApiBody({ type: UpdateMaterialGeneticoDto })
  @ApiResponse({ status: 200, description: 'Material genético atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Material genético não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialGeneticoDto, @User() user: any) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover material genético (soft delete)',
    description: 'Remove logicamente um material genético. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id', description: 'ID do material genético' })
  @ApiResponse({ status: 200, description: 'Material genético removido com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Material genético não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.service.remove(id, user);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar material genético removido',
    description: 'Restaura um material genético que foi removido (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do material genético a ser restaurado' })
  @ApiResponse({ status: 200, description: 'Material genético restaurado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Material genético não encontrado.' })
  @ApiResponse({ status: 400, description: 'Material genético não está removido.' })
  restore(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.service.restore(id, user);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todos os materiais genéticos incluindo removidos',
    description: 'Retorna todos os materiais genéticos, incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted(@User() user: any) {
    return this.service.findAllWithDeleted(user);
  }
}
