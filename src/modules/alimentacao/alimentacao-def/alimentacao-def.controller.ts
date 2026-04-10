import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseUUIDPipe, UseInterceptors, Query, HttpCode } from '@nestjs/common';
import { CacheInterceptor, CacheTTL as NestCacheTTL } from '@nestjs/cache-manager';
import { AlimentacaoDefService } from './alimentacao-def.service';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { CacheTTL } from '../../../core/cache';
import { User } from '../../auth/decorators/user.decorator';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { PropertyExistsGuard } from '../../../core/guards/property-exists.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alimentação - Definições')
@Controller('alimentacoes-def')
export class AlimentacaoDefController {
  constructor(
    private readonly alimentacaoDefService: AlimentacaoDefService,
    private readonly authHelperService: AuthHelperService,
  ) {}

  private async resolveUserId(user: { email?: string }): Promise<string> {
    return this.authHelperService.getUserId(user);
  }

  @Get('propriedade/:id_propriedade')
  @UseGuards(PropertyExistsGuard)
  @UseInterceptors(CacheInterceptor)
  @NestCacheTTL(CacheTTL.LONG)
  @ApiOperation({
    summary: 'Lista todas as definições de alimentação de uma propriedade',
    description: 'Retorna uma lista de todas as definições de alimentação cadastradas para uma propriedade específica.',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10, máx: 100)' })
  @ApiResponse({ status: 200, description: 'Lista de definições de alimentação da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async findByPropriedade(
    @Param('id_propriedade', ParseUUIDPipe) idPropriedade: string,
    @Query() paginationDto: PaginationDto,
    @User() user: { email?: string },
  ) {
    const userId = await this.resolveUserId(user);
    return this.alimentacaoDefService.findByPropriedade(idPropriedade, paginationDto, userId);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @NestCacheTTL(CacheTTL.VERY_LONG)
  @ApiOperation({
    summary: 'Busca uma alimentação definida específica',
    description: 'Retorna os dados de uma alimentação definida específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da alimentação definida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Alimentação definida encontrada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Alimentação definida não encontrada.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    return this.alimentacaoDefService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria uma nova alimentação definida',
    description: `Cria um novo registro de alimentação definida no banco de dados. 
    
    Uma definição de alimentação é um tipo de alimento que pode ser reutilizado em múltiplos registros.
    
    **Campos obrigatórios:**
    - id_propriedade: UUID da propriedade
    - tipo_alimentacao: Tipo do alimento (ex: Concentrado, Volumoso, Suplemento Mineral)
    
    **Campos opcionais:**
    - descricao: Descrição detalhada do alimento
    
    **Retorna:** O objeto completo da definição criada, incluindo o id_aliment_def gerado.`,
  })
  @ApiResponse({ status: 201, description: 'Alimentação definida criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos. Verifique os campos obrigatórios e formatos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado. Token de autenticação inválido ou ausente.' })
  async create(@Body() createAlimentacaoDefDto: CreateAlimentacaoDefDto, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    return this.alimentacaoDefService.create(createAlimentacaoDefDto, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma alimentação definida',
    description: 'Atualiza os dados de uma alimentação definida específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da alimentação definida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Alimentação definida atualizada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Alimentação definida não encontrada.' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAlimentacaoDefDto: UpdateAlimentacaoDefDto, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    return this.alimentacaoDefService.update(id, updateAlimentacaoDefDto, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove uma alimentação definida',
    description: 'Remove uma alimentação definida específica do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da alimentação definida', type: 'string' })
  @ApiResponse({ status: 204, description: 'Alimentação definida removida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Alimentação definida não encontrada.' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @User() user: { email?: string }) {
    const userId = await this.resolveUserId(user);
    await this.alimentacaoDefService.remove(id, userId);
  }
}
