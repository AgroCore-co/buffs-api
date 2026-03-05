import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

import { LoggerService } from '../../../core/logger/logger.service';

const UPLOAD_DIR = path.join(process.cwd(), 'temp', 'uploads');
const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Job agendado para limpeza de arquivos temporários de upload
 * e outras tarefas de manutenção do módulo de data-ingestion.
 */
@Injectable()
export class ScheduledIngestionJob {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Executa diariamente à 1h da manhã.
   * Remove arquivos de upload com mais de 24 horas.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  handleUploadCleanup(): void {
    this.logger.log('Iniciando limpeza de uploads antigos', {
      module: 'ScheduledIngestionJob',
      method: 'handleUploadCleanup',
    });

    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        this.logger.debug('Diretório de uploads não existe, nada a limpar', {
          module: 'ScheduledIngestionJob',
          method: 'handleUploadCleanup',
        });
        return;
      }

      const arquivos = fs.readdirSync(UPLOAD_DIR);
      const agora = Date.now();
      let removidos = 0;

      for (const arquivo of arquivos) {
        const caminhoCompleto = path.join(UPLOAD_DIR, arquivo);

        try {
          const stats = fs.statSync(caminhoCompleto);

          if (agora - stats.mtimeMs > RETENTION_MS) {
            fs.unlinkSync(caminhoCompleto);
            removidos++;
          }
        } catch {
          this.logger.warn(`Falha ao processar arquivo: ${arquivo}`, {
            module: 'ScheduledIngestionJob',
            method: 'handleUploadCleanup',
          });
        }
      }

      this.logger.log(`Limpeza concluída: ${removidos} arquivo(s) removido(s) de ${arquivos.length} total`, {
        module: 'ScheduledIngestionJob',
        method: 'handleUploadCleanup',
        removidos,
        total: arquivos.length,
      });
    } catch (error) {
      this.logger.logError(error instanceof Error ? error : new Error(String(error)), {
        module: 'ScheduledIngestionJob',
        method: 'handleUploadCleanup',
      });
    }
  }
}
