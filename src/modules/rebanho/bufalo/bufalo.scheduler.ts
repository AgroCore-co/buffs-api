import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';

@Injectable()
export class BufaloScheduler {
  private readonly logger = new Logger(BufaloScheduler.name);
  private isRunning = false;

  constructor(
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
    private readonly maturidadeService: BufaloMaturidadeService,
  ) {}

  /**
   * Roda todos os dias à meia-noite.
   * Atualiza a maturidade dos animais (ex: Bezerro -> Novilho)
   *
   * **Proteção contra concorrência:**
   * - Flag `isRunning` previne execuções simultâneas
   * - Importante se job anterior ainda estiver rodando
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMaturityUpdate() {
    // Previne execução concorrente
    if (this.isRunning) {
      this.logger.warn('Job de maturidade já está rodando. Pulando execução.');
      return;
    }

    let lockAcquired = false;
    try {
      lockAcquired = await this.bufaloRepo.tryAcquireMaturityJobLock();
    } catch (error) {
      this.logger.error(`Erro ao adquirir lock distribuído de maturidade: ${error.message}`, error.stack);
      return;
    }

    if (!lockAcquired) {
      this.logger.warn('Job de maturidade já está rodando em outra instância. Pulando execução.');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    this.logger.log('Iniciando atualização diária de maturidade...');

    try {
      // Busca apenas animais ativos para não sobrecarregar
      // Nota: Na vida real, ideal seria processar em lotes (chunks)
      const { data: bufalos } = await this.bufaloRepo.findWithFilters(
        { status: true },
        { offset: 0, limit: 1000 }, // Limite de segurança
      );

      if (bufalos && bufalos.length > 0) {
        const count = await this.maturidadeService.atualizarMaturidadeSeNecessario(bufalos);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        this.logger.log(`Job finalizado em ${duration}s. ${count} animais atualizados.`);
      } else {
        this.logger.log('Nenhum animal ativo encontrado para atualização.');
      }
    } catch (error) {
      this.logger.error(`Erro no job de maturidade: ${error.message}`, error.stack);
    } finally {
      // Sempre libera a flag, mesmo em caso de erro
      this.isRunning = false;
      try {
        await this.bufaloRepo.releaseMaturityJobLock();
      } catch (error) {
        this.logger.error(`Falha ao liberar lock distribuído de maturidade: ${error.message}`, error.stack);
      }
    }
  }
}
