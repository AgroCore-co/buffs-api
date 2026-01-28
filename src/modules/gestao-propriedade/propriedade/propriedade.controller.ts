import { Controller, Post, Body, UseGuards, Get, Param, ParseUUIDPipe, Patch, Delete, HttpCode, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { PropriedadeService } from './propriedade.service';
import { CreatePropriedadeDto, UpdatePropriedadeDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { Cargo } from '../../usuario/enums/cargo.enum';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Gestão de Propriedade - Propriedades')
@Controller('propriedades')
export class PropriedadeController {
  constructor(private readonly propriedadeService: PropriedadeService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Cargo.PROPRIETARIO)
  @ApiOperation({
    summary: '3️⃣ Criar propriedade (TERCEIRO PASSO)',
    description: `**FLUXO DE ONBOARDING - PASSO 3/3**

Cria a propriedade vinculada ao endereço criado no passo anterior.

**Ordem correta:**
1. ✅ POST /auth/signup-proprietario
2. ✅ POST /enderecos
3. 🔵 POST /propriedades (VOCÊ ESTÁ AQUI - use o idEndereco)

**Próximos passos opcionais:**
- POST /lotes (criar piquetes/lotes com geolocalização)
- POST /auth/signup-funcionario (adicionar funcionários)

**Importante:**
- O campo \`id_endereco\` é OBRIGATÓRIO e deve ser o UUID retornado no passo 2
- Apenas PROPRIETARIOS podem criar propriedades
- Após criar a propriedade, você pode:
  * Cadastrar búfalos
  * Registrar produção
  * Gerenciar alimentação
  * Adicionar funcionários`,
  })
  @ApiResponse({
    status: 201,
    description: 'Propriedade criada com sucesso. Sistema pronto para uso!',
    schema: {
      example: {
        idPropriedade: 'uuid-propriedade-456',
        nome: 'Fazenda São João',
        area_hectares: 250.5,
        id_endereco: 'uuid-endereco-123',
        id_usuario: 'uuid-usuario-789',
        created_at: '28/01/2026 14:35',
        endereco: {
          logradouro: 'Rodovia BR-101',
          cidade: 'Cachoeiro de Itapemirim',
          estado: 'ES',
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas proprietários (cargo: PROPRIETARIO) podem criar propriedades.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou id_endereco não encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil do usuário não encontrado no sistema.' })
  create(@Body() createPropriedadeDto: CreatePropriedadeDto, @User() user: any) {
    return this.propriedadeService.create(createPropriedadeDto, user);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({ summary: 'Lista todas as propriedades do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de propriedades retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll(@User() user: any) {
    return this.propriedadeService.findAll(user);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({ summary: 'Busca uma propriedade específica pelo ID UUID' })
  @ApiResponse({ status: 200, description: 'Dados da propriedade retornados.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.propriedadeService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Cargo.PROPRIETARIO)
  @ApiOperation({ summary: 'Atualiza uma propriedade' })
  @ApiResponse({ status: 200, description: 'Propriedade atualizada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePropriedadeDto: UpdatePropriedadeDto, @User() user: any) {
    return this.propriedadeService.update(id, updatePropriedadeDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Cargo.PROPRIETARIO)
  @HttpCode(204)
  @ApiOperation({ summary: 'Deleta uma propriedade' })
  @ApiResponse({ status: 204, description: 'Propriedade deletada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.propriedadeService.remove(id, user);
  }
}
