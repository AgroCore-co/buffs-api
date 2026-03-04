import { Injectable, BadRequestException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import * as fs from 'fs';
import * as path from 'path';

import { LoggerService } from '../../core/logger/logger.service';
import { UploadPlanilhaResponseDto, StatusProcessamento } from './dto';
import { UploadedFileInterface } from './interfaces';

/** Extensões de planilha aceitas no upload */
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'] as const;

/** Tamanho máximo do arquivo em bytes (10 MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Tempo de retenção dos uploads temporários: 24 horas em ms */
const UPLOAD_RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Interface para payload de mensagem RabbitMQ
 */
interface ExcelProcessingPayload {
  file_path: string;
  propriedade_id: string;
  usuario_id: string;
  timestamp: string;
}

/**
 * Serviço de Importação — orquestra upload e enfileiramento de planilhas Excel.
 *
 * **Responsabilidades:**
 * 1. Validar e persistir o arquivo `.xlsx`/`.xls` em diretório temporário
 * 2. Publicar mensagem no RabbitMQ (`excel_processing_queue`)
 * 3. Retornar confirmação imediata ao cliente
 *
 * O processamento real é delegado ao worker Go (`buffs-etl-worker`),
 * que consome as mensagens da fila e realiza a importação assíncrona.
 *
 * @class ImportacaoService
 */
@Injectable()
export class ImportacaoService implements OnModuleDestroy {
  private readonly uploadDir = path.join(process.cwd(), 'temp', 'uploads');
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.ensureUploadDir();
    void this.initRabbitMQ();
  }

  async onModuleDestroy() {
    await this.closeRabbitMQ();
  }

  /**
   * Inicializa conexão com RabbitMQ para publicação direta na fila excel_processing_queue
   */
  private async initRabbitMQ(): Promise<void> {
    try {
      const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.connection = await connect(url);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.channel = await this.connection.createConfirmChannel();

      // Declara a fila (idempotente)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.channel.assertQueue('excel_processing_queue', {
        durable: true,
      });

      this.logger.log('[Importacao] Conexão RabbitMQ estabelecida para excel_processing_queue', {
        module: 'ImportacaoService',
        method: 'initRabbitMQ',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[Importacao] Falha ao conectar RabbitMQ: ${errorMsg}`, {
        module: 'ImportacaoService',
        method: 'initRabbitMQ',
      });
    }
  }

  /**
   * Fecha conexão com RabbitMQ
   */
  private async closeRabbitMQ(): Promise<void> {
    try {
      if (this.channel) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.channel.close();
      }
      if (this.connection) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.connection.close();
      }
      this.logger.log('[Importacao] Conexão RabbitMQ encerrada', {
        module: 'ImportacaoService',
        method: 'closeRabbitMQ',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[Importacao] Erro ao fechar RabbitMQ: ${errorMsg}`, {
        module: 'ImportacaoService',
        method: 'closeRabbitMQ',
      });
    }
  }

  /**
   * Processa upload de planilha e publica para processamento assíncrono.
   *
   * O arquivo já foi salvo em disco pelo Multer (diskStorage) no controller.
   * Este método valida, obtém o caminho absoluto e notifica o worker Go via RabbitMQ.
   *
   * @param file          Arquivo Excel salvo em disco pelo Multer (diskStorage)
   * @param propriedadeId UUID da propriedade rural
   * @param usuarioId     UUID do usuário autenticado
   * @returns DTO com confirmação de envio para processamento
   * @throws BadRequestException quando o arquivo é inválido ou o envio falha
   */
  async processarPlanilha(file: UploadedFileInterface, propriedadeId: string, usuarioId: string): Promise<UploadPlanilhaResponseDto> {
    this.validarArquivo(file);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.logger.logImportacao('RECEBIDA', {
      arquivo: file.filename,
      propriedadeId,
      usuarioId,
      filePath: file.path,
    });

    await this.notificarWorkerGo({
      file_path: file.filename,
      propriedade_id: propriedadeId,
      usuario_id: usuarioId,
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Planilha enviada para processamento',
      arquivo_id: file.filename,
      status: StatusProcessamento.PROCESSANDO,
    };
  }

  /**
   * Publica mensagem na fila `excel_processing_queue` do RabbitMQ
   * para que o worker Go processe a planilha de forma assíncrona.
   *
   * @param dados Payload com file_path, propriedade_id, usuario_id e timestamp
   * @throws BadRequestException quando a publicação falha
   */
  async notificarWorkerGo(dados: ExcelProcessingPayload): Promise<void> {
    try {
      if (!this.channel) {
        // Tenta reconectar caso a conexão tenha caído
        await this.initRabbitMQ();

        if (!this.channel) {
          throw new Error('Canal RabbitMQ não disponível');
        }
      }

      // Publica diretamente na fila excel_processing_queue
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.channel.sendToQueue('excel_processing_queue', Buffer.from(JSON.stringify(dados)), { persistent: true });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      this.logger.logImportacao('ENVIADA_FILA', {
        arquivo: path.basename(dados.file_path),
        propriedadeId: dados.propriedade_id,
        usuarioId: dados.usuario_id,
        filePath: dados.file_path,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      this.logger.logImportacao('ERRO_FILA', {
        arquivo: path.basename(dados.file_path),
        propriedadeId: dados.propriedade_id,
        usuarioId: dados.usuario_id,
        erro: errorMessage,
      });

      // Rollback: remove arquivo salvo em disco
      this.removerArquivoSeguro(dados.file_path);

      throw new BadRequestException('Erro ao enviar planilha para processamento. Tente novamente.');
    }
  }

  /**
   * Remove uploads temporários com mais de 24 horas.
   * Pode ser chamado por um job agendado (cron/scheduler).
   */
  limparUploadAntigos(): void {
    try {
      const arquivos = fs.readdirSync(this.uploadDir);
      const agora = Date.now();

      for (const arquivo of arquivos) {
        const caminhoCompleto = path.join(this.uploadDir, arquivo);
        const stats = fs.statSync(caminhoCompleto);

        if (agora - stats.mtimeMs > UPLOAD_RETENTION_MS) {
          fs.unlinkSync(caminhoCompleto);
          this.logger.log(`Arquivo antigo removido: ${arquivo}`, {
            module: 'ImportacaoService',
            method: 'limparUploadAntigos',
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Falha ao limpar uploads antigos: ${error}`, {
        module: 'ImportacaoService',
        method: 'limparUploadAntigos',
      });
    }
  }

  // ─── Métodos Privados ──────────────────────────────────────────────

  /** Garante que o diretório de uploads exista no filesystem */
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Diretório de uploads criado: ${this.uploadDir}`, {
        module: 'ImportacaoService',
        method: 'ensureUploadDir',
      });
    }
  }

  /** Valida extensão e tamanho do arquivo recebido */
  private validarArquivo(file: UploadedFileInterface): void {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension as (typeof ALLOWED_EXTENSIONS)[number])) {
      throw new BadRequestException(`Formato inválido: ${fileExtension}. Aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
    }
  }

  /** Remove arquivo do disco de forma segura (sem propagar exceções) */
  private removerArquivoSeguro(caminho: string): void {
    try {
      fs.unlinkSync(caminho);
    } catch {
      this.logger.warn('Falha ao remover arquivo após erro de RabbitMQ', {
        module: 'ImportacaoService',
        method: 'removerArquivoSeguro',
      });
    }
  }
}
