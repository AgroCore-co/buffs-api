import { Module } from '@nestjs/common';
import { EnderecoController } from './endereco.controller';
import { EnderecoService } from './endereco.service';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { EnderecoRepositoryDrizzle } from './repositories';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [EnderecoController],
  providers: [EnderecoService, EnderecoRepositoryDrizzle],
})
export class EnderecoModule {}
