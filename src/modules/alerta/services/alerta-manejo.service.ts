import { Injectable, Logger } from '@nestjs/common';
import { AlertasService } from '../alerta.service';
import { ReproducaoRepositoryDrizzle } from '../repositories/reproducao.repository.drizzle';
import { ProducaoRepositoryDrizzle } from '../repositories/producao.repository.drizzle';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../dto/create-alerta.dto';
import { AlertaConstants, formatarDataBR } from '../utils/alerta.constants';

interface SecagemCandidata {
  reproducao: any;
  dataPrevistaParto: Date;
  diasAteParto: number;
}

/**
 * Serviço de domínio para alertas de MANEJO.
 * Contém toda a lógica de negócio para verificação de:
 * - Secagem pendente (búfalas gestantes que ainda estão em ordenha)
 *
 * Responsabilidade: Lógica de negócio de alertas de manejo.
 */
@Injectable()
export class AlertaManejoService {
  private readonly logger = new Logger(AlertaManejoService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly reproducaoRepo: ReproducaoRepositoryDrizzle,
    private readonly producaoRepo: ProducaoRepositoryDrizzle,
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
  ) {}

  /**
   * Verifica búfalas gestantes que precisam ser secas (parar ordenha antes do parto).
   */
  async verificarSecagemPendente(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando secagem pendente${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      const reproducoes = await this.reproducaoRepo.buscarGestacoesConfirmadas(id_propriedade);

      if (!reproducoes || reproducoes.length === 0) {
        this.logger.log('Nenhuma gestação confirmada encontrada.');
        return 0;
      }

      const hoje = new Date();
      const candidatasSecagem: SecagemCandidata[] = [];

      for (const rep of reproducoes) {
        if (!rep.dtEvento || !rep.idBufala) {
          continue;
        }

        const dataEvento = new Date(rep.dtEvento);
        const dataPrevistaParto = new Date(dataEvento);
        dataPrevistaParto.setDate(dataEvento.getDate() + AlertaConstants.TEMPO_GESTACAO_DIAS);

        const diffTime = dataPrevistaParto.getTime() - hoje.getTime();
        const diasAteParto = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diasAteParto > 0 && diasAteParto <= AlertaConstants.DIAS_SECAGEM_ANTES_PARTO) {
          candidatasSecagem.push({
            reproducao: rep,
            dataPrevistaParto,
            diasAteParto,
          });
        }
      }

      if (!candidatasSecagem.length) {
        this.logger.log('Nenhuma búfala na janela de secagem encontrada.');
        return 0;
      }

      const idsBufalas = Array.from(new Set(candidatasSecagem.map((item) => item.reproducao.idBufala)));
      const [ordenhasRecentes, bufalasCompletas] = await Promise.all([
        this.producaoRepo.buscarOrdenhasRecentesBatch(idsBufalas, AlertaConstants.DIAS_VERIFICACAO_ORDENHA_SECAGEM),
        this.bufaloRepo.buscarBufalosCompletosBatch(idsBufalas),
      ]);

      const idsEmOrdenha = new Set(ordenhasRecentes.map((ordenha) => ordenha.idBufala).filter((id): id is string => Boolean(id)));
      const bufalaMap = new Map(bufalasCompletas.map((bufala) => [bufala.idBufalo, bufala]));

      let alertasCriados = 0;

      for (const candidata of candidatasSecagem) {
        const idBufala = candidata.reproducao.idBufala;

        if (!idsEmOrdenha.has(idBufala)) {
          continue;
        }

        const bufalaData = bufalaMap.get(idBufala);
        if (!bufalaData) {
          this.logger.warn(`Dados da búfala ${idBufala} não encontrados no lote de secagem.`);
          continue;
        }

        try {
          const alertaCriado = await this.criarAlertaSecagem(candidata.reproducao, candidata.dataPrevistaParto, candidata.diasAteParto, bufalaData);
          if (alertaCriado) {
            alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar reprodução ${candidata.reproducao.idReproducao}:`, error);
        }
      }

      this.logger.log(`Verificação de secagem concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de secagem:', error);
      return 0;
    }
  }

  /**
   * Cria alerta de secagem pendente.
   */
  private async criarAlertaSecagem(reproducao: any, dataPrevistaParto: Date, diasAteParto: number, bufalaData: any): Promise<boolean> {
    try {
      const grupoNome = bufalaData.grupo?.nomeGrupo ?? 'Não informado';
      const propriedadeNome = bufalaData.propriedade?.nome ?? 'Não informada';

      const propriedadeId = reproducao.idPropriedade || bufalaData.idPropriedade;

      // Prioridade ALTA se está na janela final (últimos 45 dias)
      const prioridade = diasAteParto <= AlertaConstants.DIAS_SECAGEM_JANELA_FINAL ? PrioridadeAlerta.ALTA : PrioridadeAlerta.MEDIA;

      const alertaDto: CreateAlertaDto = {
        animal_id: bufalaData.idBufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Búfala ${bufalaData.nome} gestante precisa ser seca. Parto previsto em ${diasAteParto} dias (${formatarDataBR(dataPrevistaParto)}).`,
        nicho: NichoAlerta.MANEJO,
        data_alerta: new Date().toISOString().split('T')[0],
        prioridade,
        texto_ocorrencia_clinica: `Búfala ${bufalaData.nome} está gestante com parto previsto para ${formatarDataBR(dataPrevistaParto)} (daqui a ${diasAteParto} dias) mas continua em ordenha. Necessário realizar secagem para permitir recuperação da glândula mamária e preparação adequada para próxima lactação. Recomenda-se secar entre 45-60 dias antes do parto através da suspensão gradual da ordenha, evitando mastite e garantindo saúde da vaca e do bezerro.`,
        observacao: `Recomenda-se secar 60 dias antes do parto. Suspender ordenha gradualmente para preparação do animal.`,
        id_evento_origem: reproducao.idReproducao,
        tipo_evento_origem: 'SECAGEM_PENDENTE',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de secagem:', error);
      return false;
    }
  }
}
