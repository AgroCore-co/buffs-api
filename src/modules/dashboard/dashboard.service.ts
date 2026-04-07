import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';
import {
  DashboardStatsDto,
  DashboardLactacaoDto,
  CicloLactacaoMetricaDto,
  DashboardProducaoMensalDto,
  ProducaoMensalItemDto,
  DashboardReproducaoDto,
} from './dto';
import { formatToSimpleDate } from '../../core/utils/date-formatter.utils';
import { DashboardRepositoryDrizzle } from './repositories';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Retorna estatísticas do dashboard para uma propriedade específica
   */
  async getStats(id_propriedade: string): Promise<DashboardStatsDto> {
    try {
      // Executa queries em paralelo para melhor performance
      const [bufalosStats, bufalasLactando, qtdLotes, qtdUsuarios] = await Promise.all([
        this.dashboardRepository.buscarBufalosComRaca(id_propriedade),
        this.dashboardRepository.buscarBufalasLactando(id_propriedade),
        this.dashboardRepository.contarLotes(id_propriedade),
        this.dashboardRepository.contarUsuarios(id_propriedade),
      ]);

      // Processa as estatísticas
      const bufalos: any[] = bufalosStats || [];
      const bufalosAtivos = bufalos.filter((b) => b.status === true);

      // Processa búfalos por raça (APENAS ATIVOS)
      const racaMap = new Map<string, number>();

      bufalosAtivos.forEach((bufalo: any) => {
        const nomeRaca = bufalo.raca?.nome || 'Sem Raça';
        racaMap.set(nomeRaca, (racaMap.get(nomeRaca) || 0) + 1);
      });

      const bufalosPorRaca = Array.from(racaMap.entries())
        .map(([raca, quantidade]) => ({ raca, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade); // Ordena por quantidade decrescente

      const stats: DashboardStatsDto = {
        qtd_macho_ativos: bufalosAtivos.filter((b) => b.sexo === 'M').length,
        qtd_femeas_ativas: bufalosAtivos.filter((b) => b.sexo === 'F').length,
        qtd_bufalos_registradas: bufalos.length,
        qtd_bufalos_bezerro: bufalosAtivos.filter((b) => b.nivelMaturidade === 'B').length,
        qtd_bufalos_novilha: bufalosAtivos.filter((b) => b.nivelMaturidade === 'N').length,
        qtd_bufalos_vaca: bufalosAtivos.filter((b) => b.nivelMaturidade === 'V').length,
        qtd_bufalos_touro: bufalosAtivos.filter((b) => b.nivelMaturidade === 'T').length,
        qtd_bufalas_lactando: bufalasLactando?.length || 0,
        qtd_lotes: Number(qtdLotes) || 0,
        qtd_usuarios: Number(qtdUsuarios) || 0,
        bufalosPorRaca,
      };

      return stats;
    } catch (error) {
      this.logger.logError(error, { module: 'Dashboard', method: 'getStats', id_propriedade });
      throw new InternalServerErrorException(`Erro inesperado ao gerar estatísticas: ${error.message}`);
    }
  }

  /**
   * Retorna métricas de lactação por ciclo de uma propriedade em um ano específico
   */
  async getLactacaoMetricas(id_propriedade: string, ano: number): Promise<DashboardLactacaoDto> {
    try {
      // Busca ciclos de lactação da propriedade com dados relacionados, já agregados e filtrados no banco
      const ciclosFiltered = await this.dashboardRepository.buscarCiclosLactacaoCompletos(id_propriedade, ano);

      // Agrupar ciclos por búfala para calcular número do parto
      const ciclosPorBufala = new Map<string, any[]>();
      ciclosFiltered.forEach((ciclo: any) => {
        const id = ciclo.idBufala;
        if (!ciclosPorBufala.has(id)) {
          ciclosPorBufala.set(id, []);
        }
        ciclosPorBufala.get(id)!.push(ciclo);
      });

      // Processar dados de cada ciclo
      const ciclosProcessados: CicloLactacaoMetricaDto[] = [];

      ciclosPorBufala.forEach((ciclosDaBufala) => {
        ciclosDaBufala.sort((a, b) => new Date(a.dtParto).getTime() - new Date(b.dtParto).getTime());

        ciclosDaBufala.forEach((ciclo: any, index: number) => {
          const diasLactacao = Math.floor((new Date(ciclo.dtSecagemReal).getTime() - new Date(ciclo.dtParto).getTime()) / (1000 * 60 * 60 * 24));

          const lactacaoTotal = Number(ciclo.totalLeite) || 0;
          const qtdOrdenhas = Number(ciclo.qtdOrdenhas) || 0;
          const mediaLactacao = qtdOrdenhas > 0 ? lactacaoTotal / qtdOrdenhas : 0;

          ciclosProcessados.push({
            id_ciclo_lactacao: ciclo.idCicloLactacao,
            id_bufala: ciclo.idBufala,
            nome_bufala: ciclo.nomeBufala,
            numero_parto: index + 1,
            dt_parto: new Date(ciclo.dtParto).toISOString().split('T')[0],
            dt_secagem_real: new Date(ciclo.dtSecagemReal).toISOString().split('T')[0],
            dias_em_lactacao: diasLactacao,
            media_lactacao: Math.round(mediaLactacao * 1000) / 1000,
            lactacao_total: Math.round(lactacaoTotal * 1000) / 1000,
            classificacao: '',
          });
        });
      });

      // Calcular média do rebanho para o ano
      const mediaRebanho =
        ciclosProcessados.length > 0 ? ciclosProcessados.reduce((sum, c) => sum + c.lactacao_total, 0) / ciclosProcessados.length : 0;

      // Classificar e ordenar
      const ciclosClassificados = ciclosProcessados
        .map((ciclo: any) => ({
          ...ciclo,
          classificacao:
            ciclo.lactacao_total >= mediaRebanho * 1.2
              ? 'Ótima'
              : ciclo.lactacao_total >= mediaRebanho
                ? 'Boa'
                : ciclo.lactacao_total >= mediaRebanho * 0.8
                  ? 'Mediana'
                  : 'Ruim',
        }))
        .sort((a, b) => {
          const classOrder = { Ótima: 1, Boa: 2, Mediana: 3, Ruim: 4 };
          const classCompare = classOrder[a.classificacao as keyof typeof classOrder] - classOrder[b.classificacao as keyof typeof classOrder];
          return classCompare !== 0 ? classCompare : b.lactacao_total - a.lactacao_total;
        });

      return {
        ano,
        media_rebanho_ano: Math.round(mediaRebanho * 1000) / 1000,
        ciclos: ciclosClassificados,
      };
    } catch (error) {
      this.logger.logError(error, { module: 'Dashboard', method: 'getLactacaoMetricas', id_propriedade, ano });
      throw new InternalServerErrorException(`Erro inesperado ao gerar métricas de lactação: ${error.message}`);
    }
  }

  /**
   * Retorna métricas de produção mensal de leite de uma propriedade
   */
  async getProducaoMensal(id_propriedade: string, ano?: number): Promise<DashboardProducaoMensalDto> {
    const anoReferencia = ano || new Date().getFullYear();

    try {
      // Buscar todas as ordenhas do ano
      const dataInicio = `${anoReferencia}-01-01`;
      const dataFim = `${anoReferencia}-12-31`;

      const ordenhas = await this.dashboardRepository.buscarOrdenhasPorPeriodo(id_propriedade, dataInicio, dataFim);

      // Agrupar por mês
      const producaoPorMes = new Map<string, { total: number; bufalas: Set<string>; dias: Set<string> }>();

      ordenhas.forEach((ordenha: any) => {
        const mes = ordenha.dtOrdenha.substring(0, 7); // YYYY-MM

        if (!producaoPorMes.has(mes)) {
          producaoPorMes.set(mes, { total: 0, bufalas: new Set(), dias: new Set() });
        }

        const mesData = producaoPorMes.get(mes)!;
        mesData.total += Number(ordenha.qtOrdenha) || 0;
        mesData.bufalas.add(ordenha.idBufala);
        mesData.dias.add(ordenha.dtOrdenha.substring(0, 10)); // YYYY-MM-DD
      });

      // Construir série histórica
      const serieHistorica: ProducaoMensalItemDto[] = [];

      // Determinar o último mês com dados no ano solicitado
      let ultimoMesComDados = 0;
      for (let mes = 1; mes <= 12; mes++) {
        const mesStr = `${anoReferencia}-${mes.toString().padStart(2, '0')}`;
        if (producaoPorMes.has(mesStr)) {
          ultimoMesComDados = mes;
        }
      }

      // Se não há dados, usar mês atual do ano
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtualNumero = hoje.getMonth() + 1;

      const mesReferenciaAtual = ultimoMesComDados > 0 ? ultimoMesComDados : anoReferencia === anoAtual ? mesAtualNumero : 12;
      const mesReferenciaAnterior = mesReferenciaAtual > 1 ? mesReferenciaAtual - 1 : 12;

      const mesAtualStr = `${anoReferencia}-${mesReferenciaAtual.toString().padStart(2, '0')}`;
      const mesAnteriorStr =
        mesReferenciaAtual > 1 ? `${anoReferencia}-${mesReferenciaAnterior.toString().padStart(2, '0')}` : `${anoReferencia - 1}-12`;

      // Preencher todos os 12 meses do ano
      for (let mes = 1; mes <= 12; mes++) {
        const mesStr = `${anoReferencia}-${mes.toString().padStart(2, '0')}`;
        const dados = producaoPorMes.get(mesStr);

        const totalLitros = dados?.total || 0;
        const qtdBufalas = dados?.bufalas.size || 0;
        const diasComOrdenha = dados?.dias.size || 1;
        const mediaDiaria = totalLitros / diasComOrdenha;

        serieHistorica.push({
          mes: mesStr,
          total_litros: Math.round(totalLitros * 100) / 100,
          qtd_bufalas: qtdBufalas,
          media_diaria: Math.round(mediaDiaria * 100) / 100,
        });
      }

      // Dados do mês atual e anterior
      const dadosMesAtual = producaoPorMes.get(mesAtualStr);
      const mesAtualLitros = dadosMesAtual?.total || 0;
      const bufalasLactantesAtual = dadosMesAtual?.bufalas.size || 0;

      const dadosMesAnterior = producaoPorMes.get(mesAnteriorStr);
      const mesAnteriorLitros = dadosMesAnterior?.total || 0;

      // Calcular variação percentual
      const variacaoPercentual = mesAnteriorLitros > 0 ? ((mesAtualLitros - mesAnteriorLitros) / mesAnteriorLitros) * 100 : 0;

      return {
        ano: anoReferencia,
        mes_atual_litros: Math.round(mesAtualLitros * 100) / 100,
        mes_anterior_litros: Math.round(mesAnteriorLitros * 100) / 100,
        variacao_percentual: Math.round(variacaoPercentual * 100) / 100,
        bufalas_lactantes_atual: bufalasLactantesAtual,
        serie_historica: serieHistorica,
      };
    } catch (error) {
      this.logger.logError(error, { module: 'Dashboard', method: 'getProducaoMensal', id_propriedade, ano: anoReferencia });
      throw new InternalServerErrorException(`Erro inesperado ao gerar métricas de produção mensal: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas de reprodução de uma propriedade
   */
  async getReproducaoMetricas(id_propriedade: string): Promise<DashboardReproducaoDto> {
    try {
      // Busca todas as reproduções da propriedade
      const reproducoes = await this.dashboardRepository.buscarReproducoes(id_propriedade);

      // Contabilizar por status
      const reproducoesArray: any[] = reproducoes || [];
      const totalEmAndamento = reproducoesArray.filter((r) => r.status === 'Em andamento').length;
      const totalConfirmada = reproducoesArray.filter((r) => r.status === 'Confirmada').length;
      const totalFalha = reproducoesArray.filter((r) => r.status === 'Falha').length;

      // A primeira reprodução é a mais recente
      const ultimaDataReproducao = reproducoesArray.length > 0 ? formatToSimpleDate(reproducoesArray[0].dtEvento) : null;

      return {
        totalEmAndamento,
        totalConfirmada,
        totalFalha,
        ultimaDataReproducao,
      };
    } catch (error) {
      this.logger.logError(error, { module: 'Dashboard', method: 'getReproducaoMetricas', id_propriedade });
      throw new InternalServerErrorException(`Erro inesperado ao gerar métricas de reprodução: ${error.message}`);
    }
  }
}
