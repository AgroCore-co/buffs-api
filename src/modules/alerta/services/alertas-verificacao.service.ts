import { Injectable } from '@nestjs/common';
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
  constructor(
    private readonly reproducaoService: AlertaReproducaoService,
    private readonly sanitarioService: AlertaSanitarioService,
    private readonly producaoService: AlertaProducaoService,
    private readonly manejoService: AlertaManejoService,
    private readonly clinicoService: AlertaClinicoService,
  ) {}

  async verificarPorPropriedade(idPropriedade: string, nichos?: string | string[]) {
    const nichosArray = this.normalizarNichos(nichos);

    const resultados = await Promise.all(
      nichosArray.map(async (nicho) => {
        const resultado = await this.executarNicho(nicho, idPropriedade);
        return { nicho, ...resultado };
      }),
    );

    const detalhes = resultados.reduce<Record<string, unknown>>((acc, item) => {
      acc[item.nicho] = item.detalhes;
      return acc;
    }, {});

    const total = resultados.reduce((acc, item) => acc + item.total, 0);

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

    const valores = Array.isArray(nichos) ? nichos : [nichos];
    return valores as NichoAlerta[];
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
