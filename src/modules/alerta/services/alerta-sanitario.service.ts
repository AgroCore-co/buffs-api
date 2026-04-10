import { Injectable, Logger } from '@nestjs/common';
import { AlertasService } from '../alerta.service';
import { SanitarioRepositoryDrizzle } from '../repositories/sanitario.repository.drizzle';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { CreateAlertaDto, NichoAlerta } from '../dto/create-alerta.dto';
import { AlertaConstants, formatarDataBR } from '../utils/alerta.constants';

interface TratamentoComRetorno {
  idSanit: string | null;
  idBufalo: string | null;
  doenca?: string | null;
  observacao?: string | null;
  dtRetorno: string | null;
  medicacoe?: {
    tipoTratamento?: string | null;
    medicacao?: string | null;
  } | null;
}

interface VacinacaoProgramada {
  idSanit: string | null;
  idBufalo: string | null;
  dtAplicacao: string | null;
  doenca?: string | null;
  tipoVacina?: string | null;
}

/**
 * Serviço de domínio para alertas SANITÁRIOS.
 * Contém toda a lógica de negócio para verificação de:
 * - Tratamentos com retorno programado
 * - Vacinações programadas
 *
 * Responsabilidade: Lógica de negócio de alertas sanitários.
 */
@Injectable()
export class AlertaSanitarioService {
  private readonly logger = new Logger(AlertaSanitarioService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly sanitarioRepo: SanitarioRepositoryDrizzle,
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
  ) {}

  /**
   * Verifica tratamentos com retorno programado.
   */
  async verificarTratamentos(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando tratamentos${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      // Buscar IDs dos búfalos da propriedade se fornecida
      let ids_bufalos: string[] | undefined;
      if (id_propriedade) {
        const bufalos = await this.bufaloRepo.buscarIdsBufalosPorPropriedade(id_propriedade);
        ids_bufalos = bufalos?.filter(Boolean);
        if (!ids_bufalos || ids_bufalos.length === 0) {
          this.logger.log('Nenhum búfalo encontrado na propriedade.');
          return 0;
        }
      }

      const tratamentos = await this.sanitarioRepo.buscarTratamentosComRetorno(AlertaConstants.ANTECEDENCIA_SANITARIO_DIAS, ids_bufalos);

      if (!tratamentos || tratamentos.length === 0) {
        this.logger.log('Nenhum tratamento com retorno encontrado.');
        return 0;
      }

      let alertasCriados = 0;

      for (const trat of tratamentos) {
        try {
          if (!trat.dtRetorno) continue;
          const alertaCriado = await this.criarAlertaTratamento(trat as TratamentoComRetorno, new Date(trat.dtRetorno));
          if (alertaCriado) alertasCriados++;
        } catch (error) {
          this.logger.error(`Erro ao processar tratamento ${trat.idSanit}:`, error);
        }
      }

      this.logger.log(`Verificação de tratamentos concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de tratamentos:', error);
      return 0;
    }
  }

  /**
   * Cria alerta de tratamento com retorno.
   */
  private async criarAlertaTratamento(tratamento: TratamentoComRetorno, dtRetorno: Date): Promise<boolean> {
    try {
      if (!tratamento.idBufalo || !tratamento.idSanit) {
        this.logger.warn('Tratamento ignorado por ausência de idBufalo/idSanit.');
        return false;
      }

      const bufaloData = await this.bufaloRepo.buscarBufaloCompleto(tratamento.idBufalo);
      if (!bufaloData) return false;

      const grupoNome = bufaloData.grupo?.nomeGrupo ?? 'Não informado';
      const propriedadeNome = bufaloData.propriedade?.nome ?? 'Não informada';
      const propriedadeId = bufaloData.idPropriedade;
      const tipoIntervencao = tratamento.medicacoe?.medicacao ?? tratamento.medicacoe?.tipoTratamento ?? 'Intervenção';
      const descricaoTratamento = tratamento.doenca ?? tratamento.observacao ?? 'condição não especificada';

      const alertaDto: CreateAlertaDto = {
        animal_id: bufaloData.idBufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Retorno agendado para ${formatarDataBR(dtRetorno)} - ${tipoIntervencao}.`,
        nicho: NichoAlerta.SANITARIO,
        data_alerta: dtRetorno.toISOString().split('T')[0],
        texto_ocorrencia_clinica: `Búfalo ${bufaloData.nome} possui retorno agendado para ${formatarDataBR(dtRetorno)} referente a tratamento de ${descricaoTratamento}. Tipo de intervenção: ${tipoIntervencao}. Necessário separar animal para reavaliação veterinária e verificar evolução do quadro clínico.`,
        observacao: `Tratamento: ${descricaoTratamento}. Separar animal para reavaliação veterinária.`,
        id_evento_origem: tratamento.idSanit,
        tipo_evento_origem: 'DADOS_SANITARIOS',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de tratamento:', error);
      return false;
    }
  }

  /**
   * Verifica vacinações programadas.
   */
  async verificarVacinacoes(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando vacinações${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      // Buscar IDs dos búfalos da propriedade se fornecida
      let ids_bufalos: string[] | undefined;
      if (id_propriedade) {
        const bufalos = await this.bufaloRepo.buscarIdsBufalosPorPropriedade(id_propriedade);
        ids_bufalos = bufalos;
        if (!ids_bufalos || ids_bufalos.length === 0) {
          this.logger.log('Nenhum búfalo encontrado na propriedade.');
          return 0;
        }
      }

      const vacinacoes = await this.sanitarioRepo.buscarVacinacoesProgramadas(AlertaConstants.ANTECEDENCIA_VACINACAO_DIAS, ids_bufalos);

      if (!vacinacoes || vacinacoes.length === 0) {
        this.logger.log('Nenhuma vacinação programada encontrada.');
        return 0;
      }

      let alertasCriados = 0;

      for (const vac of vacinacoes) {
        try {
          if (!vac.dtAplicacao) continue;
          const alertaCriado = await this.criarAlertaVacinacao(vac as VacinacaoProgramada, new Date(vac.dtAplicacao));
          if (alertaCriado) alertasCriados++;
        } catch (error) {
          this.logger.error(`Erro ao processar vacinação ${vac.idSanit}:`, error);
        }
      }

      this.logger.log(`Verificação de vacinações concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de vacinações:', error);
      return 0;
    }
  }

  /**
   * Cria alerta de vacinação programada.
   */
  private async criarAlertaVacinacao(vacinacao: VacinacaoProgramada, dtProxVac: Date): Promise<boolean> {
    try {
      if (!vacinacao.idBufalo || !vacinacao.idSanit) {
        this.logger.warn('Vacinação ignorada por ausência de idBufalo/idSanit.');
        return false;
      }

      const bufaloData = await this.bufaloRepo.buscarBufaloCompleto(vacinacao.idBufalo);
      if (!bufaloData) return false;

      const grupoNome = bufaloData.grupo?.nomeGrupo ?? 'Não informado';
      const propriedadeNome = bufaloData.propriedade?.nome ?? 'Não informada';
      const propriedadeId = bufaloData.idPropriedade;
      const tipoVacina = vacinacao.tipoVacina ?? vacinacao.doenca ?? 'Não informado';

      const alertaDto: CreateAlertaDto = {
        animal_id: bufaloData.idBufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Vacinação de ${bufaloData.nome} programada para ${formatarDataBR(dtProxVac)}.`,
        nicho: NichoAlerta.SANITARIO,
        data_alerta: dtProxVac.toISOString().split('T')[0],
        texto_ocorrencia_clinica: `Vacinação programada para búfalo ${bufaloData.nome} em ${formatarDataBR(dtProxVac)}. Vacina: ${tipoVacina}. Necessário preparar seringas, verificar estoque do imunobiológico e condições de armazenamento. Protocolo de vacinação conforme calendário sanitário do rebanho.`,
        observacao: `Vacina: ${tipoVacina}. Preparar seringas e verificar estoque do imunobiológico.`,
        id_evento_origem: vacinacao.idSanit,
        tipo_evento_origem: 'VACINACAO',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de vacinação:', error);
      return false;
    }
  }
}
