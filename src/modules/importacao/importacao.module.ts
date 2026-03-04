import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImportacaoController } from './importacao.controller';
import { ImportacaoService } from './importacao.service';
import { LoggerModule } from '../../core/logger/logger.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Módulo de Importação de Planilhas Excel.
 *
 * **Responsabilidades:**
 * - Receber uploads de arquivos `.xlsx`/`.xls`
 * - Validar arquivos e persistir em disco temporário
 * - Publicar mensagens no RabbitMQ para processamento assíncrono
 *
 * **Dependências:**
 * - `ConfigModule` — acesso às variáveis de ambiente (RABBITMQ_URL)
 * - `LoggerModule` — logging estruturado (via `LoggerService`)
 * - `AuthModule` — autenticação JWT via Supabase
 *
 * **Endpoints:**
 * - `POST /importacao/planilha/:propriedadeId` (autenticado)
 *
 * **Fluxo:**
 * 1. Cliente faz POST com arquivo Excel
 * 2. Controller valida MIME type e tamanho
 * 3. Service salva em `./temp/uploads/`
 * 4. Service publica no RabbitMQ (via amqplib, direto na fila excel_processing_queue)
 * 5. Worker Go (`buffs-etl-worker`) consome e processa
 */
@Module({
  imports: [ConfigModule, LoggerModule, AuthModule],
  controllers: [ImportacaoController],
  providers: [ImportacaoService],
  exports: [ImportacaoService],
})
export class ImportacaoModule {}
