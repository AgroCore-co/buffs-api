import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { NichoAlerta } from '../dto/create-alerta.dto';
import { AlertaReproducaoService } from './alerta-reproducao.service';
import { AlertaSanitarioService } from './alerta-sanitario.service';
import { AlertaProducaoService } from './alerta-producao.service';
import { AlertaManejoService } from './alerta-manejo.service';
import { AlertaClinicoService } from './alerta-clinico.service';

interface VerificacaoResultado {
  total: number;
  detalhes: Record<string, unknown>;
}

@Injectable()
export class AlertasVerificacaoService {
  private readonly logger = new Logger(AlertasVerificacaoService.name);

  constructor(
    private readonly reproducaoService: AlertaReproducaoService,
    private readonly sanitarioService: AlertaSanitarioService,
    private readonly producaoService: AlertaProducaoService,
    private readonly manejoService: AlertaManejoService,
    private readonly clinicoService: AlertaClinicoService,
  ) {}

  async verificarPorPropriedade(idPropriedade: string, nichos?: string | string[]) {
    const nichosArray = this.normalizarNichos(nichos);

    const resultados = await Promise.allSettled(
      nichosArray.map(async (nicho) => {
        const resultado = await this.executarNicho(nicho, idPropriedade);
        return { nicho, ...resultado };
      }),
    );

    const detalhes = resultados.reduce<Record<string, unknown>>((acc, item, index) => {
      const nicho = nichosArray[index];

      if (item.status === 'fulfilled') {
        acc[nicho] = item.value.detalhes;
        return acc;
      }

      const reason = item.reason instanceof Error ? item.reason.message : String(item.reason);
      this.logger.error(`Falha na verificacao do nicho ${nicho}: ${reason}`);
      acc[nicho] = { erro: reason };
      return acc;
    }, {});

    const total = resultados.reduce((acc, item) => {
      if (item.status === 'fulfilled') {
        return acc + item.value.total;
      }
      return acc;
    }, 0);

    return {
      success: true,
      message: 'Verificação de alertas concluída',
      propriedade: idPropriedade,
      nichos_verificados: nichosArray,
      alertas_criados: total,
      detalhes,
    };
  }

  private normalizarNichos(nichos?: string | string[]): NichoAlerta[] {
    if (!nichos) {
      return [NichoAlerta.CLINICO, NichoAlerta.SANITARIO, NichoAlerta.REPRODUCAO, NichoAlerta.MANEJO, NichoAlerta.PRODUCAO];
    }

    const valoresBrutos = Array.isArray(nichos) ? nichos : [nichos];
    const valoresNormalizados = Array.from(
      new Set(
        valoresBrutos
          .flatMap((valor) => String(valor).split(','))
          .map((valor) => valor.trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    if (!valoresNormalizados.length) {
      return [NichoAlerta.CLINICO, NichoAlerta.SANITARIO, NichoAlerta.REPRODUCAO, NichoAlerta.MANEJO, NichoAlerta.PRODUCAO];
    }

    const nichosValidos = new Set(Object.values(NichoAlerta));
    const invalidos = valoresNormalizados.filter((valor) => !nichosValidos.has(valor as NichoAlerta));

    if (invalidos.length > 0) {
      throw new BadRequestException(`Nicho(s) inválido(s): ${invalidos.join(', ')}`);
    }

    return valoresNormalizados as NichoAlerta[];
  }

  private async executarNicho(nicho: NichoAlerta, idPropriedade: string): Promise<VerificacaoResultado> {
    switch (nicho) {
      case NichoAlerta.SANITARIO: {
        const [tratamentos, vacinacoes] = await Promise.all([
          this.sanitarioService.verificarTratamentos(idPropriedade),
          this.sanitarioService.verificarVacinacoes(idPropriedade),
        ]);

        return {
          total: tratamentos + vacinacoes,
          detalhes: { tratamentos, vacinacoes },
        };
      }

      case NichoAlerta.REPRODUCAO: {
        const [nascimentos, coberturasSemDiag, femeasVazias] = await Promise.all([
          this.reproducaoService.verificarNascimentos(idPropriedade),
          this.reproducaoService.verificarCoberturaSemDiagnostico(idPropriedade),
          this.reproducaoService.verificarFemeasVazias(idPropriedade),
        ]);

        return {
          total: nascimentos + coberturasSemDiag + femeasVazias,
          detalhes: {
            nascimentos,
            coberturas_sem_diagnostico: coberturasSemDiag,
            femeas_vazias: femeasVazias,
          },
        };
      }

      case NichoAlerta.PRODUCAO: {
        const quedaProducao = await this.producaoService.verificarQuedaProducao(idPropriedade);
        return {
          total: quedaProducao,
          detalhes: { queda_producao: quedaProducao },
        };
      }

      case NichoAlerta.MANEJO: {
        const secagem = await this.manejoService.verificarSecagemPendente(idPropriedade);
        return {
          total: secagem,
          detalhes: { secagem_pendente: secagem },
        };
      }

      case NichoAlerta.CLINICO: {
        const sinaisClinicos = await this.clinicoService.verificarSinaisClinicosPrecoces(idPropriedade);
        return {
          total: sinaisClinicos,
          detalhes: { sinais_clinicos_precoces: sinaisClinicos },
        };
      }

      default:
        return {
          total: 0,
          detalhes: {},
        };
    }
  }
}
