import { Controller, Post, Body, UseGuards, Get, Param, Patch, Delete, ParseUUIDPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { EnderecoService } from './endereco.service';
import { CreateEnderecoDto, UpdateEnderecoDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../../usuario/enums/cargo.enum';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Cargo.PROPRIETARIO)
@ApiTags('Gestão de Propriedade - Endereços')
@Controller('enderecos')
/**
 * Controller de Endereços
 *
 * Gerencia endereços das propriedades. Os endereços são vinculados às propriedades
 * e devem ser criados ANTES de criar uma propriedade.
 *
 * Fluxo típico:
 * 1. POST /enderecos - Criar endereço
 * 2. POST /propriedades - Criar propriedade (usando idEndereco)
 * 3. POST /lotes - Criar lotes com geometria (usando idPropriedade)
 */
export class EnderecoController {
  constructor(private readonly enderecoService: EnderecoService) {}

  @Post()
  @ApiOperation({
    summary: '2. Criar endereço (SEGUNDO PASSO)',
    description: `**FLUXO DE ONBOARDING - PASSO 2/3**

Cria um endereço que será vinculado à propriedade no próximo passo.

**Ordem correta:**
1. ✅ POST /auth/signup-proprietario
2. 🔵 POST /enderecos (VOCÊ ESTÁ AQUI)
3. ⏩ POST /propriedades (usando o idEndereco retornado)

**Importante:** Guarde o \`idEndereco\` retornado, você vai precisar dele no próximo passo.`,
  })
  @ApiResponse({
    status: 201,
    description: 'Endereço criado com sucesso. Use o idEndereco retornado para criar a propriedade.',
    schema: {
      example: {
        idEndereco: 'uuid-endereco-123',
        logradouro: 'Rodovia BR-101',
        numero: 'Km 45',
        complemento: 'Propriedade Rural',
        bairro: 'Zona Rural',
        cidade: 'Cachoeiro de Itapemirim',
        estado: 'ES',
        cep: '29300-000',
        created_at: '28/01/2026 14:32',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos (CEP inválido, estado com formato incorreto, etc).' })
  @ApiResponse({ status: 401, description: 'Não autorizado. Token JWT ausente ou inválido.' })
  create(@Body() createEnderecoDto: CreateEnderecoDto) {
    return this.enderecoService.create(createEnderecoDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Lista todos os endereços',
    description: 'Retorna uma lista de todos os endereços cadastrados no sistema.',
  })
  @ApiResponse({ status: 200, description: 'Lista de endereços retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    return this.enderecoService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Busca um endereço específico',
    description: 'Retorna os dados de um endereço específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do endereço (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Endereço encontrado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enderecoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um endereço',
    description: 'Atualiza os dados de um endereço específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do endereço (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Endereço atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateEnderecoDto: UpdateEnderecoDto) {
    return this.enderecoService.update(id, updateEnderecoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um endereço',
    description: 'Remove um endereço específico do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do endereço (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Endereço removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.enderecoService.remove(id);
  }
}
