import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';

@Injectable()
export class BufaloScheduler {
  private readonly logger = new Logger(BufaloScheduler.name);

  constructor(
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
    private readonly maturidadeService: BufaloMaturidadeService,
  ) {}

  /**
   * Roda todos os dias à meia-noite.
   * Atualiza a maturidade dos animais (ex: Bezerro -> Novilho)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMaturityUpdate() {
    this.logger.log('Iniciando atualização diária de maturidade...');

    // Busca apenas animais ativos para não sobrecarregar
    // Nota: Na vida real, ideal seria processar em lotes (chunks)
    const { data: bufalos } = await this.bufaloRepo.findWithFilters(
      { status: true },
      { offset: 0, limit: 1000 }, // Limite de segurança
    );

    if (bufalos && bufalos.length > 0) {
      const count = await this.maturidadeService.atualizarMaturidadeSeNecessario(bufalos);
      this.logger.log(`Job finalizado. ${count} animais atualizados.`);
    } else {
      this.logger.log('Nenhum animal ativo encontrado para atualização.');
    }
  }
}
