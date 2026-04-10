import { Controller, Get, Post, Body, Param, Patch, Delete, ParseUUIDPipe, UseGuards, Query, ForbiddenException, HttpCode } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { CreateRegistroAlimentacaoDto } from './dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { User } from '../../auth/decorators/user.decorator';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { PropertyExistsGuard } from '../../../core/guards/property-exists.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alimentação - Registros')
@Controller('alimentacao/registros')
export class RegistrosController {
  constructor(
    private readonly service: RegistrosService,
    private readonly authHelperService: AuthHelperService,
  ) {}

  private async resolveUserId(user: { email?: string }): Promise<string> {
    return this.authHelperService.getUserId(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um registro de alimentação',
    description: `Registra uma ocorrência de alimentação fornecida a um grupo de búfalos.
    
    **Campos obrigatórios:**
    - id_propriedade: UUID da propriedade
    - id_grupo: UUID do grupo de búfalos
    - id_aliment_def: UUID da definição de alimentação (use GET /alimentacoes-def/propriedade/:id para listar)
    - quantidade: Valor numérico positivo
    - unidade_medida: String (kg, g, L, etc)
    
    **Campos opcionais:**
    - freq_dia: Frequência por dia (número inteiro)
    - dt_registro: Data/hora no formato ISO 8601
    
    **Retorna:** O registro completo criado com id_registro gerado.`,
  })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos. Verifique os campos obrigatórios e formatos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado. Token de autenticação inválido ou ausente.' })
  create(@Body() dto: CreateRegistroAlimentacaoDto, @User('id_usuario') idUsuario: string | null) {
    if (!idUsuario) {
      throw new ForbiddenException('Usuário autenticado sem perfil cadastrado.');
    }

    return this.service.create({ ...dto, id_usuario: idUsuario });
  }

  @Get('propriedade/:id_propriedade')
  @UseGuards(PropertyExistsGuard)
  @ApiOperation({
    summary: 'Lista todos os registros de alimentação de uma propriedade',
    description: `Retorna todos os registros de alimentação de uma propriedade específica.
    
    **Inclui joins com:**
    - alimentacao_def: tipo_alimentacao e descricao
    - grupo: nome_grupo
    - usuario: nome do usuário que registrou
    
    **Ordenação:** Por data de criação (mais recentes primeiro).`,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10, máx: 100)' })
  @ApiResponse({ status: 200, description: 'Lista de registros da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async findByPropriedade(
    @Param('id_propriedade', ParseUUIDPipe) idPropriedade: string,
    @Query() paginationDto: PaginationDto,
    @User() user: { email?: string },
  ) {
    const userId = await this.resolveUserId(user);
    return this.service.findByPropriedade(idPropriedade, paginationDto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    return this.service.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um registro de alimentação',
    description: `Atualiza parcialmente um registro de alimentação existente.
    
    **Todos os campos são opcionais** - apenas os campos fornecidos serão atualizados.
    
    **Campos comumente atualizados:**
    - quantidade: Nova quantidade fornecida
    - freq_dia: Nova frequência por dia
    - unidade_medida: Nova unidade de medida
    
    **Retorna:** O registro completo atualizado.`,
  })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRegistroAlimentacaoDto, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um registro de alimentação' })
  @ApiResponse({ status: 204, description: 'Registro removido.' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    await this.service.remove(id, userId);
  }
}
