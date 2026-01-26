import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertaReproducaoService } from './services/alerta-reproducao.service';
import { AlertaSanitarioService } from './services/alerta-sanitario.service';
import { AlertaProducaoService } from './services/alerta-producao.service';
import { AlertaManejoService } from './services/alerta-manejo.service';
import { AlertaClinicoService } from './services/alerta-clinico.service';
import { DatabaseService } from '../../core/database/database.service';
import { isNull } from 'drizzle-orm';
import { propriedade } from '../../database/schema';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHEDULER DE ALERTAS - ORQUESTRADOR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Responsabilidade: Orquestrar a execução dos schedulers de alertas.
 * Delega toda a lógica de negócio aos serviços de domínio.
 *
 * Horários dos CRON jobs:
 * - 00:00 - Tratamentos sanitários (SANITARIO)
 * - 00:05 - Nascimentos previstos (REPRODUCAO)
 * - 01:00 - Coberturas sem diagnóstico (REPRODUCAO)
 * - 02:00 - Fêmeas vazias (REPRODUCAO)
 * - 03:00 - Vacinações programadas (SANITARIO)
 * - 04:00 - Queda de produção de leite (PRODUCAO)
 * - 05:00 - Secagem pendente (MANEJO)
 * - 06:00 - Sinais clínicos precoces (CLINICO)
 */
@Injectable()
export class AlertasScheduler implements OnModuleInit {
  private readonly logger = new Logger(AlertasScheduler.name);

  constructor(
    private readonly reproducaoService: AlertaReproducaoService,
    private readonly sanitarioService: AlertaSanitarioService,
    private readonly producaoService: AlertaProducaoService,
    private readonly manejoService: AlertaManejoService,
    private readonly clinicoService: AlertaClinicoService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Hook executado quando o módulo é inicializado.
   * Confirma que o scheduler foi carregado e exibe informações de debug.
   */
  onModuleInit() {
    const now = new Date();
    const timezone = process.env.TZ || 'UTC';
    const ambiente = process.env.NODE_ENV || 'development';

    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('ALERTAS SCHEDULER INICIALIZADO COM SUCESSO');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log(`Data/Hora Sistema: ${now.toISOString()}`);
    this.logger.log(`Data/Hora Local: ${now.toLocaleString('pt-BR', { timeZone: timezone })}`);
    this.logger.log(`Timezone: ${timezone}`);
    this.logger.log(`Ambiente: ${ambiente}`);
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('CRON JOBS CONFIGURADOS:');
    this.logger.log('   [00:00] Tratamentos sanitários');
    this.logger.log('   [00:05] Nascimentos previstos');
    this.logger.log('   [01:00] Coberturas sem diagnóstico');
    this.logger.log('   [02:00] Fêmeas vazias');
    this.logger.log('   [03:00] Vacinações programadas');
    this.logger.log('   [04:00] Queda de produção');
    this.logger.log('   [05:00] Secagem pendente');
    this.logger.log('   [06:00] Sinais clínicos precoces');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.warn('Scheduler está ATIVO e aguardando horários programados');
    this.logger.log('═══════════════════════════════════════════════════════════════');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SANITÁRIO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica tratamentos com retorno programado.
   * @cron "0 0 * * *" (todo dia à meia-noite)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verificarTratamentos() {
    const inicio = Date.now();
    this.logger.log(' [00:00] ═══════════════════════════════════════════════');
    this.logger.log('🩺 [SCHEDULER] Iniciando verificação de tratamentos sanitários...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`📍 ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.sanitarioService.verificarTratamentos(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  /**
   * Verifica vacinações programadas.
   * @cron "0 3 * * *" (todo dia às 03:00)
   */
  @Cron('0 3 * * *')
  async verificarVacinacoes() {
    const inicio = Date.now();
    this.logger.log('� [03:00] ═══════════════════════════════════════════════');
    this.logger.log('�💉 [SCHEDULER] Iniciando verificação de vacinações programadas...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`📍 ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.sanitarioService.verificarVacinacoes(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REPRODUÇÃO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica nascimentos previstos para os próximos 30 dias.
   * @cron "5 0 * * *" (todo dia às 00:05)
   */
  @Cron('5 0 * * *')
  async verificarNascimentos() {
    const inicio = Date.now();
    this.logger.log('� [00:05] ═══════════════════════════════════════════════');
    this.logger.log('�🐃 [SCHEDULER] Iniciando verificação de nascimentos previstos...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`📍 ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.reproducaoService.verificarNascimentos(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  /**
   * Verifica coberturas sem diagnóstico há mais de 90 dias.
   * @cron "0 1 * * *" (todo dia às 01:00)
   */
  @Cron('0 1 * * *')
  async verificarCoberturaSemDiagnostico() {
    const inicio = Date.now();
    this.logger.log('🕐 [01:00] ═══════════════════════════════════════════════');
    this.logger.log('🔬 [SCHEDULER] Iniciando verificação de coberturas sem diagnóstico...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`📍 ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.reproducaoService.verificarCoberturaSemDiagnostico(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  /**
   * Verifica fêmeas vazias há mais de 180 dias.
   * @cron "0 2 * * *" (todo dia às 02:00)
   */
  @Cron('0 2 * * *')
  async verificarFemeasVazias() {
    const inicio = Date.now();
    this.logger.log('🕐 [02:00] ═══════════════════════════════════════════════');
    this.logger.log('🚺 [SCHEDULER] Iniciando verificação de fêmeas vazias...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`📍 ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.reproducaoService.verificarFemeasVazias(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUÇÃO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica quedas significativas na produção de leite.
   * @cron "0 4 * * *" (todo dia às 04:00)
   */
  @Cron('0 4 * * *')
  async verificarQuedaProducao() {
    const inicio = Date.now();
    this.logger.log('🕐 [04:00] ═══════════════════════════════════════════════');
    this.logger.log('🥛 [SCHEDULER] Iniciando verificação de queda de produção...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`📍 ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.producaoService.verificarQuedaProducao(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MANEJO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica búfalas gestantes que precisam ser secas.
   * @cron "0 5 * * *" (todo dia às 05:00)
   */
  @Cron('0 5 * * *')
  async verificarSecagemPendente() {
    const inicio = Date.now();
    this.logger.log('🕐 [05:00] ═══════════════════════════════════════════════');
    this.logger.log('🛑 [SCHEDULER] Iniciando verificação de secagem pendente...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`📍 ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.manejoService.verificarSecagemPendente(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CLÍNICO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica sinais clínicos precoces (múltiplos tratamentos, ganho de peso insuficiente).
   * Executa para TODAS as propriedades do sistema.
   * @cron "0 6 * * *" (todo dia às 06:00)
   */
  @Cron('0 6 * * *')
  async verificarSinaisClinicosPrecoces() {
    const inicio = Date.now();
    this.logger.log('🕐 [06:00] ═══════════════════════════════════════════════');
    this.logger.log('🩹 [SCHEDULER] Iniciando verificação de sinais clínicos precoces...');

    try {
      const propriedades = await this.getPropriedadesAtivas();
      this.logger.log(`� ${propriedades.length} propriedades ativas encontradas`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.clinicoService.verificarSinaisClinicosPrecoces(prop.id_propriedade);
          totalAlertas += alertas;
          if (alertas > 0) {
            this.logger.log(`   ✅ ${prop.nome}: ${alertas} alertas criados`);
          }
        } catch (error) {
          this.logger.error(`   ❌ Erro na propriedade ${prop.nome}: ${error.message}`);
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`✅ [SCHEDULER] Verificação concluída em ${duracao}s - ${totalAlertas} alertas criados`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Erro crítico: ${error.message}`, error.stack);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Busca todas as propriedades ativas do sistema.
   * @returns Array de propriedades com id_propriedade e nome
   */
  private async getPropriedadesAtivas(): Promise<Array<{ id_propriedade: string; nome: string }>> {
    try {
      const propriedades = await this.databaseService.db.query.propriedade.findMany({
        where: isNull(propriedade.deletedAt),
        columns: {
          idPropriedade: true,
          nome: true,
        },
      });

      return propriedades.map((p) => ({
        id_propriedade: p.idPropriedade,
        nome: p.nome,
      }));
    } catch (error) {
      this.logger.error('❌ Erro crítico ao buscar propriedades:', error);
      return [];
    }
  }
}
