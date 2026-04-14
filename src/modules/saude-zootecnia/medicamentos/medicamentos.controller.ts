import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { MedicamentosService } from './medicamentos.service';
import { CreateMedicacaoDto, UpdateMedicacaoDto } from './dto';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { PropertyExistsGuard } from '../../../core/guards/property-exists.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Medicamentos')
@Controller('medicamentos')
export class MedicamentosController {
  constructor(
    private readonly service: MedicamentosService,
    private readonly authHelperService: AuthHelperService,
  ) {}

  private async resolveUserId(user: { email?: string }): Promise<string> {
    return this.authHelperService.getUserId(user);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova medicação' })
  @ApiResponse({ status: 201, description: 'Medicação criada com sucesso.' })
  create(@Body() dto: CreateMedicacaoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as medicações' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista todas as medicações de uma propriedade específica' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lista de medicações da propriedade retornada com sucesso.' })
  @UseGuards(PropertyExistsGuard)
  async findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    return this.service.findByPropriedade(id_propriedade, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma medicação pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da medicação', type: 'string' })
  @ApiResponse({ status: 200, description: 'Medicação encontrada.' })
  @ApiResponse({ status: 404, description: 'Medicação não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma medicação' })
  @ApiParam({ name: 'id', description: 'ID da medicação a ser atualizada', type: 'string' })
  @ApiResponse({ status: 200, description: 'Medicação atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Medicação não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMedicacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover medicação (soft delete)',
    description: 'Remove logicamente uma medicação. Use POST /:id/restore para restaurar.',
  })
  @ApiParam({ name: 'id', description: 'ID da medicação a ser removida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Medicação removida com sucesso (soft delete).' })
  @ApiResponse({ status: 404, description: 'Medicação não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar medicação removida',
    description: 'Restaura uma medicação que foi removida (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID da medicação a ser restaurada', type: 'string' })
  @ApiResponse({ status: 200, description: 'Medicação restaurada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Medicação não encontrada.' })
  @ApiResponse({ status: 400, description: 'Medicação não está removida.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar todas as medicações incluindo removidas',
    description: 'Retorna todas as medicações, incluindo as removidas (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista completa retornada com sucesso.' })
  findAllWithDeleted() {
    return this.service.findAllWithDeleted();
  }
}
