import { Module, forwardRef } from '@nestjs/common';
import { UsuarioService } from './services/usuario.service';
import { FuncionarioService } from './services/funcionario.service';
import { UsuarioController } from './controller/usuario.controller';
import { CoreModule } from '../../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper } from './repositories';

@Module({
  imports: [forwardRef(() => CoreModule), forwardRef(() => AuthModule)],
  controllers: [UsuarioController],
  providers: [UsuarioService, FuncionarioService, UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper],
  exports: [UsuarioService, FuncionarioService, UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper],
})
export class UsuarioModule {}
