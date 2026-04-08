import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthFacadeService } from './auth-facade.service';
import { SignInDto, RefreshDto, SignUpProprietarioDto, SignUpFuncionarioDto } from './dto';
import { SupabaseAuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { User } from './decorators/user.decorator';
import { Cargo } from '../usuario/enums/cargo.enum';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authFacade: AuthFacadeService,
  ) {}

  @Post('signup-proprietario')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentativas por minuto
  @ApiOperation({
    summary: '1. Criar conta de proprietário (PRIMEIRO PASSO)',
    description: `**FLUXO DE ONBOARDING - PASSO 1/3**

Cria conta de autenticação no Supabase + perfil de PROPRIETARIO no banco em uma operação atômica.

**⚠️ Rate Limit:** 3 tentativas por minuto por IP

**O que acontece:**
- ✅ Cria conta no Supabase Auth
- ✅ Cria perfil no banco com cargo PROPRIETARIO
- ✅ Retorna token de acesso (access_token) para próximos passos
- ✅ Se qualquer etapa falhar, faz rollback automático

**Próximos passos após signup:**
1. Confirmar email (link enviado automaticamente)
2. Criar endereço: POST /enderecos
3. Criar propriedade: POST /propriedades (usando id_endereco)

**Importante:** Este é o endpoint recomendado para registro. Use o token retornado para os próximos passos.`,
  })
  @ApiResponse({
    status: 201,
    description: 'Proprietário registrado com sucesso. Token de acesso retornado.',
    schema: {
      example: {
        message: 'Proprietário registrado com sucesso. Verifique seu email para confirmar a conta.',
        user: {
          idUsuario: 'uuid',
          nome: 'João Silva',
          email: 'proprietario@fazenda.com',
          cargo: 'PROPRIETARIO',
          created_at: '28/01/2026 14:30',
        },
        session: {
          access_token: 'eyJhbGc...',
          refresh_token: 'refresh...',
          expires_at: 1706543400,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos (email inválido, senha curta, etc).' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado no sistema.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Tente novamente em alguns minutos.' })
  async signupProprietario(@Body() dto: SignUpProprietarioDto) {
    return this.authFacade.registerProprietario(dto);
  }

  @Post('signup-funcionario')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @ApiOperation({
    summary: 'Criar funcionário (Apenas PROPRIETARIO ou GERENTE)',
    description: `**Cria um novo funcionário no sistema**

Cria conta de autenticação + perfil + vincula a propriedades em operação atômica.

**⚠️ Rate Limit:** 5 tentativas por minuto por IP

**Permissões necessárias:**
- ✅ PROPRIETARIO ou GERENTE
- ✅ Deve ter pelo menos UMA propriedade cadastrada

**O que acontece:**
- ✅ Cria conta no Supabase Auth
- ✅ Cria perfil com cargo especificado (GERENTE, FUNCIONARIO ou VETERINARIO)
- ✅ Vincula à propriedade especificada OU a todas as propriedades do proprietário
- ✅ Rollback automático se falhar

**Cargos disponíveis:**
- **GERENTE:** Pode gerenciar funcionários e visualizar dados
- **FUNCIONARIO:** Acesso operacional básico
- **VETERINARIO:** Acesso especializado em saúde animal

**Vinculação de propriedades:**
- Se \`id_propriedade\` for informado: vincula apenas àquela propriedade
- Se NÃO informado: vincula a TODAS as propriedades do proprietário`,
  })
  @ApiResponse({
    status: 201,
    description: 'Funcionário registrado e vinculado com sucesso.',
    schema: {
      example: {
        message: 'Funcionário registrado com sucesso.',
        user: {
          idUsuario: 'uuid',
          nome: 'Carlos Pereira',
          email: 'funcionario@fazenda.com',
          cargo: 'FUNCIONARIO',
          created_at: '28/01/2026 14:35',
        },
        propriedades_vinculadas: ['prop-uuid-1', 'prop-uuid-2'],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos, propriedade não pertence ao usuário, ou usuário sem propriedades cadastradas.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas PROPRIETARIO ou GERENTE podem criar funcionários.' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado no sistema.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Tente novamente em alguns minutos.' })
  async signupFuncionario(@Body() dto: SignUpFuncionarioDto, @User('sub') authId: string) {
    return this.authFacade.registerFuncionario(dto, authId);
  }

  // ==================== ENDPOINTS PADRÃO ====================

  @Post('signin')
  @ApiOperation({
    summary: 'Faz login do usuário',
    description:
      'Autentica o usuário e retorna tokens de acesso. O access_token deve ser usado no header Authorization: Bearer <token> para acessar endpoints protegidos.',
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou email não confirmado.' })
  @ApiResponse({ status: 503, description: 'Serviço de autenticação temporariamente indisponível.' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renova o token de acesso',
    description: 'Usa o refresh_token para obter um novo access_token quando o atual expira.',
  })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
  @ApiResponse({ status: 503, description: 'Serviço de autenticação temporariamente indisponível.' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refresh_token);
  }

  @Post('signout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Faz logout do usuário',
    description: 'Invalida a sessão atual do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  @ApiResponse({ status: 503, description: 'Serviço de autenticação temporariamente indisponível.' })
  async signOut(@Headers('authorization') authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!accessToken) {
      throw new UnauthorizedException('Token de acesso não informado.');
    }

    return this.authService.signOut(accessToken);
  }
}
