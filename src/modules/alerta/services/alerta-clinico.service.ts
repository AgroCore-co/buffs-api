import { Injectable, Logger } from '@nestjs/common';
import { AlertasService } from '../alerta.service';
import { SanitarioRepositoryDrizzle } from '../repositories/sanitario.repository.drizzle';
import { ProducaoRepositoryDrizzle } from '../repositories/producao.repository.drizzle';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../dto/create-alerta.dto';
import { AlertaConstants, calcularIdadeEmMeses } from '../utils/alerta.constants';

/**
 * Serviço de domínio para alertas CLÍNICOS.
 * Contém toda a lógica de negócio para verificação de:
 * - Sinais clínicos precoces (múltiplos tratamentos, ganho de peso insuficiente)
 *
 * Responsabilidade: Lógica de negócio de alertas clínicos/preventivos.
 */
@Injectable()
export class AlertaClinicoService {
  private readonly logger = new Logger(AlertaClinicoService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly sanitarioRepo: SanitarioRepositoryDrizzle,
    private readonly producaoRepo: ProducaoRepositoryDrizzle,
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
  ) {}

  /**
   * Verifica sinais clínicos precoces que indicam problemas de saúde.
   * Busca búfalos com:
   * - Múltiplos tratamentos em curto período
   * - Ganho de peso insuficiente
   */
  async verificarSinaisClinicosPrecoces(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando sinais clínicos precoces${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      // Buscar IDs dos búfalos da propriedade
      let ids_bufalos: string[];
      if (id_propriedade) {
        const bufalos = await this.bufaloRepo.buscarIdsBufalosPorPropriedade(id_propriedade);
        ids_bufalos = bufalos ?? [];
      } else {
        // Se não forneceu propriedade, buscar limitado para evitar sobrecarga
        this.logger.warn('Verificação de sinais clínicos sem propriedade específica não é recomendado.');
        return 0;
      }

      if (ids_bufalos.length === 0) {
        this.logger.log('Nenhum búfalo encontrado.');
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const id_bufalo of ids_bufalos) {
        try {
          // Verificar múltiplos tratamentos
          const multiplos = await this.verificarTratamentosMultiplos(id_bufalo);

          // Verificar ganho de peso
          const pesoInsuficiente = await this.verificarGanhoPesoInsuficiente(id_bufalo);

          if (multiplos || pesoInsuficiente) {
            const alertaCriado = await this.criarAlertaSinaisClinicosPrecoces(id_bufalo, multiplos, pesoInsuficiente, hoje, id_propriedade);
            if (alertaCriado) alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar búfalo ${id_bufalo}:`, error);
        }
      }

      this.logger.log(`Verificação de sinais clínicos concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de sinais clínicos:', error);
      return 0;
    }
  }

  /**
   * Verifica se búfalo teve múltiplos tratamentos recentes.
   */
  private async verificarTratamentosMultiplos(id_bufalo: string): Promise<boolean> {
    const tratamentos = await this.sanitarioRepo.buscarTratamentosRecentes(id_bufalo, AlertaConstants.PERIODO_ANALISE_PESO_DIAS);

    return !!(tratamentos && tratamentos.length >= AlertaConstants.TRATAMENTOS_MULTIPLOS_THRESHOLD);
  } /**
   * Verifica se búfalo teve ganho de peso insuficiente.
   */
  private async verificarGanhoPesoInsuficiente(id_bufalo: string): Promise<boolean> {
    const pesagens = await this.producaoRepo.buscarPesagensRecentes(id_bufalo, AlertaConstants.PERIODO_ANALISE_PESO_DIAS);

    if (!pesagens || pesagens.length < AlertaConstants.MIN_PESAGENS_ANALISE) {
      return false; // Dados insuficientes
    }

    const pesoInicial = parseFloat(pesagens[0].peso || '0');
    const pesoFinal = parseFloat(pesagens[pesagens.length - 1].peso || '0');
    const ganho = pesoFinal - pesoInicial;

    return ganho < AlertaConstants.GANHO_PESO_MINIMO_60_DIAS;
  }

  /**
   * Cria alerta de sinais clínicos precoces.
   */
  private async criarAlertaSinaisClinicosPrecoces(
    id_bufalo: string,
    multiplos: boolean,
    pesoInsuficiente: boolean,
    hoje: Date,
    id_propriedade?: string,
  ): Promise<boolean> {
    try {
      const bufaloData = await this.bufaloRepo.buscarBufaloSimples(id_bufalo);
      if (!bufaloData) return false;

      let grupoNome = 'Não informado';
      if (bufaloData.idGrupo) {
        const nomeGrupo = await this.bufaloRepo.buscarNomeGrupo(bufaloData.idGrupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      const propriedadeIdFinal = id_propriedade || bufaloData.idPropriedade;
      if (propriedadeIdFinal) {
        const nomeProp = await this.bufaloRepo.buscarNomePropriedade(propriedadeIdFinal);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      let motivo = `Sinais clínicos precoces em ${bufaloData.nome}: `;
      const sinais: string[] = [];
      const descricaoClinicaDetalhes: string[] = [];

      if (multiplos) {
        sinais.push('múltiplos tratamentos recentes');
        descricaoClinicaDetalhes.push(
          'apresentou múltiplos tratamentos em curto período, sugerindo baixa resposta imunológica ou condições crônicas',
        );
      }
      if (pesoInsuficiente) {
        sinais.push('ganho de peso insuficiente');
        descricaoClinicaDetalhes.push(
          `teve ganho de peso abaixo do esperado (menos de ${AlertaConstants.GANHO_PESO_MINIMO_60_DIAS}kg nos últimos ${AlertaConstants.PERIODO_ANALISE_PESO_DIAS} dias), indicando possível deficiência nutricional ou problemas de saúde`,
        );
      }

      motivo += sinais.join(', ') + '.';

      const descricaoClinica = `Búfalo ${bufaloData.nome} com ${calcularIdadeEmMeses(bufaloData.dtNascimento)} meses de idade ${descricaoClinicaDetalhes.join(' e ')}. Estes sinais clínicos precoces requerem atenção veterinária para avaliação de condição corporal, carga parasitária, qualidade da alimentação, absorção de nutrientes e manejo geral do animal. Intervenção precoce pode prevenir quadros clínicos mais graves.`;

      const alertaDto: CreateAlertaDto = {
        animal_id: bufaloData.idBufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeIdFinal,
        motivo: motivo,
        nicho: NichoAlerta.CLINICO,
        data_alerta: hoje.toISOString().split('T')[0],
        texto_ocorrencia_clinica: descricaoClinica,
        observacao: `Idade: ${calcularIdadeEmMeses(bufaloData.dtNascimento)} meses. Avaliar condição corporal, parasitas, qualidade da alimentação e manejo geral. Considerar avaliação veterinária detalhada.`,
        id_evento_origem: id_bufalo,
        tipo_evento_origem: 'SINAIS_CLINICOS',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de sinais clínicos:', error);
      return false;
    }
  }
}
