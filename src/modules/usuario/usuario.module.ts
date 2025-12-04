import { Module } from '@nestjs/common';
import { UsuarioService } from './services/usuario.service';
import { FuncionarioService } from './services/funcionario.service';
import { UsuarioController } from './controller/usuario.controller';
import { FuncionarioController } from './controller/funcionario.controller';
import { CoreModule } from '../../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper } from './repositories';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [UsuarioController, FuncionarioController],
  providers: [UsuarioService, FuncionarioService, UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper],
  exports: [UsuarioService, FuncionarioService, UsuarioRepositoryDrizzle],
})
export class UsuarioModule {}
