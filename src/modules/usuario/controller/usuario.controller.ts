import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UsuarioService } from '../services/usuario.service';
import { FuncionarioService } from '../services/funcionario.service';
import { CreateFuncionarioDto, CreateUsuarioDto, UpdateUsuarioDto, UpdateCargoDto } from '../dto';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Cargo } from '../enums/cargo.enum';

@ApiTags('Usuários')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly funcionarioService: FuncionarioService,
  ) {}

  // ==================== USUÁRIO ROUTES ====================

  @Get('me')
  @ApiOperation({
    summary: 'Retorna o perfil do usuário logado',
    description: 'Busca e retorna o perfil de dados do usuário que está fazendo a requisição.',
  })
  @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado para o usuário autenticado.' })
  findMyProfile(@User() user: any) {
    return this.usuarioService.findOneByEmail(user.email);
  }

  @Get()
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Lista todos os usuários (Admin)',
    description: 'Lista todos os usuários do sistema. Apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Buscar usuário por ID (Admin)',
    description: 'Busca um usuário específico por seu ID UUID. Apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Atualizar usuário (Admin)',
    description: 'Atualiza os dados de um usuário. Apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  @Patch(':id/cargo')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Atualizar cargo de funcionário',
    description:
      'Permite alterar o cargo de um funcionário entre GERENTE, FUNCIONARIO e VETERINARIO. Não permite alteração para/de PROPRIETARIO. Apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Cargo atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Cargo inválido.' })
  @ApiResponse({ status: 403, description: 'Acesso negado ou tentativa de alterar cargo de PROPRIETARIO.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  updateCargo(@Param('id', ParseUUIDPipe) id: string, @Body() updateCargoDto: UpdateCargoDto, @User() user: any) {
    return this.usuarioService.updateCargo(id, updateCargoDto.cargo, {
      id_usuario: user.id,
      cargo: user.cargo,
    });
  }

  @Delete(':id')
  @Roles(Cargo.PROPRIETARIO)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Excluir usuário (Proprietário)',
    description: 'Exclui um usuário do sistema. Apenas para proprietários.',
  })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarioService.remove(id);
  }

  // ==================== FUNCIONÁRIO ROUTES (Consulta Apenas) ====================

  @Get('funcionarios')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Listar meus funcionários',
    description: 'Lista todos os funcionários de todas as propriedades do proprietário/gerente logado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de funcionários retornada com sucesso.' })
  listarMeusFuncionarios(@User('sub') authId: string) {
    return this.funcionarioService.listarMeusFuncionarios(authId);
  }

  @Get('funcionarios/propriedade/:idPropriedade')
  @ApiOperation({
    summary: 'Listar funcionários de uma propriedade',
    description: 'Retorna todos os funcionários vinculados a uma propriedade específica.',
  })
  @ApiResponse({ status: 200, description: 'Lista de funcionários da propriedade retornada.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Você não é proprietário desta propriedade.' })
  listarFuncionariosPorPropriedade(@Param('idPropriedade', ParseUUIDPipe) idPropriedade: string, @User('sub') authId: string) {
    return this.funcionarioService.listarFuncionariosPorPropriedade(idPropriedade, authId);
  }

  @Delete('funcionarios/:idUsuario/propriedade/:idPropriedade')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Desvincular um funcionário de uma propriedade',
    description: 'Remove o vínculo entre um funcionário e uma propriedade específica.',
  })
  @ApiResponse({ status: 200, description: 'Funcionário desvinculado com sucesso.' })
  desvincularFuncionario(
    @Param('idUsuario', ParseUUIDPipe) idUsuario: string,
    @Param('idPropriedade', ParseUUIDPipe) idPropriedade: string,
    @User('sub') authId: string,
  ) {
    return this.funcionarioService.desvincularFuncionario(idUsuario, idPropriedade, authId);
  }
}
