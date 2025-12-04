import { Injectable, Logger } from '@nestjs/common';
import { AlertasService } from '../alerta.service';
import { ReproducaoRepositoryDrizzle } from '../repositories/reproducao.repository.drizzle';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../dto/create-alerta.dto';
import { AlertaConstants, formatarDataBR, calcularIdadeEmMeses } from '../utils/alerta.constants';

/**
 * Serviço de domínio para alertas de REPRODUÇÃO.
 * Contém toda a lógica de negócio para verificação de:
 * - Nascimentos previstos
 * - Coberturas sem diagnóstico
 * - Fêmeas vazias
 *
 * Responsabilidade: Lógica de negócio de alertas reprodutivos.
 * Não contém queries diretas ao banco (usa repositories).
 */
@Injectable()
export class AlertaReproducaoService {
  private readonly logger = new Logger(AlertaReproducaoService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly reproducaoRepo: ReproducaoRepositoryDrizzle,
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
  ) {}

  /**
   * Verifica nascimentos previstos para os próximos 30 dias.
   * Pode processar todas as propriedades ou uma específica.
   */
  async verificarNascimentos(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando nascimentos${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      const reproducoes = await this.reproducaoRepo.buscarGestacoesConfirmadas(id_propriedade);

      if (!reproducoes || reproducoes.length === 0) {
        this.logger.log('Nenhuma gestação confirmada encontrada.');
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const rep of reproducoes) {
        try {
          if (!rep.dtEvento) continue;

          // Calcula data prevista de parto
          const dataEvento = new Date(rep.dtEvento);
          const dataPrevistaParto = new Date(dataEvento);
          dataPrevistaParto.setDate(dataEvento.getDate() + AlertaConstants.TEMPO_GESTACAO_DIAS);

          const diffTime = dataPrevistaParto.getTime() - hoje.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Cria alerta se está dentro da janela de antecedência
          if (diffDays > 0 && diffDays <= AlertaConstants.ANTECEDENCIA_PARTO_DIAS) {
            const alertaCriado = await this.criarAlertaNascimento(rep, dataPrevistaParto, dataEvento);
            if (alertaCriado) alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar reprodução ${rep.idReproducao}:`, error);
        }
      }

      this.logger.log(`Verificação de nascimentos concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de nascimentos:', error);
      return 0;
    }
  }

  /**
   * Cria alerta de nascimento previsto.
   */
  private async criarAlertaNascimento(reproducao: any, dataPrevistaParto: Date, dataEvento: Date): Promise<boolean> {
    try {
      const bufalaData = await this.bufaloRepo.buscarBufaloSimples(reproducao.idBufala);
      if (!bufalaData) return false;

      let grupoNome = 'Não informado';
      if (bufalaData.idGrupo) {
        const nomeGrupo = await this.bufaloRepo.buscarNomeGrupo(bufalaData.idGrupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      const propriedadeId = reproducao.idPropriedade || bufalaData.idPropriedade;
      if (propriedadeId) {
        const nomeProp = await this.bufaloRepo.buscarNomePropriedade(propriedadeId);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      const alertaDto: CreateAlertaDto = {
        animal_id: bufalaData.idBufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Previsão de parto para ${formatarDataBR(dataPrevistaParto)}.`,
        nicho: NichoAlerta.REPRODUCAO,
        data_alerta: dataPrevistaParto.toISOString().split('T')[0],
        texto_ocorrencia_clinica: `Búfala ${bufalaData.nome} com parto previsto para ${formatarDataBR(dataPrevistaParto)}. Gestação confirmada em ${formatarDataBR(dataEvento)}. Necessário preparar área de maternidade e monitorar sinais de proximidade do parto.`,
        observacao: `Preparar área de maternidade. Gestação confirmada em ${formatarDataBR(dataEvento)}.`,
        id_evento_origem: reproducao.idReproducao,
        tipo_evento_origem: 'DADOS_REPRODUCAO',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao criar alerta de nascimento:`, error);
      return false;
    }
  }

  /**
   * Verifica coberturas sem diagnóstico há mais de 90 dias.
   * Alerta RECORRENTE.
   */
  async verificarCoberturaSemDiagnostico(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando coberturas sem diagnóstico${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      const coberturas = await this.reproducaoRepo.buscarCoberturasSemDiagnostico(AlertaConstants.DIAS_SEM_DIAGNOSTICO_COBERTURA, id_propriedade);

      if (!coberturas || coberturas.length === 0) {
        this.logger.log('Nenhuma cobertura sem diagnóstico encontrada.');
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const cob of coberturas) {
        try {
          const dtCobertura = new Date(cob.dtEvento);
          const diasDesdeCobertura = Math.floor((hoje.getTime() - dtCobertura.getTime()) / (1000 * 60 * 60 * 24));

          if (diasDesdeCobertura >= AlertaConstants.DIAS_SEM_DIAGNOSTICO_COBERTURA) {
            const alertaCriado = await this.criarAlertaCoberturaSemDiagnostico(cob, diasDesdeCobertura, hoje);
            if (alertaCriado) alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar cobertura ${cob.idReproducao}:`, error);
        }
      }

      this.logger.log(`Verificação de coberturas concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de coberturas:', error);
      return 0;
    }
  }

  /**
   * Cria alerta de cobertura sem diagnóstico (recorrente).
   */
  private async criarAlertaCoberturaSemDiagnostico(cobertura: any, diasDesdeCobertura: number, hoje: Date): Promise<boolean> {
    try {
      const bufalaData = await this.bufaloRepo.buscarBufaloSimples(cobertura.idBufala);
      if (!bufalaData) return false;

      let grupoNome = 'Não informado';
      if (bufalaData.idGrupo) {
        const nomeGrupo = await this.bufaloRepo.buscarNomeGrupo(bufalaData.idGrupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      const propriedadeId = cobertura.idPropriedade || bufalaData.idPropriedade;
      if (propriedadeId) {
        const nomeProp = await this.bufaloRepo.buscarNomePropriedade(propriedadeId);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      const alertaDto: CreateAlertaDto = {
        animal_id: bufalaData.idBufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Cobertura de ${bufalaData.nome} em ${formatarDataBR(cobertura.dtEvento)} ainda sem diagnóstico (${diasDesdeCobertura} dias).`,
        nicho: NichoAlerta.REPRODUCAO,
        data_alerta: hoje.toISOString().split('T')[0],
        texto_ocorrencia_clinica: `Búfala ${bufalaData.nome} foi coberta há ${diasDesdeCobertura} dias (em ${formatarDataBR(cobertura.dtEvento)}) mas ainda não foi realizado diagnóstico de gestação. Tipo de cobertura: ${cobertura.tipo_inseminacao || 'Não informado'}. Diagnóstico recomendado entre 45-60 dias após cobertura.`,
        observacao: `Recomenda-se diagnóstico entre 45-60 dias. Tipo: ${cobertura.tipo_inseminacao || 'Não informado'}. Realizar ultrassonografia.`,
        id_evento_origem: cobertura.idReproducao,
        tipo_evento_origem: 'COBERTURA_SEM_DIAGNOSTICO',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de cobertura:', error);
      return false;
    }
  }

  /**
   * Verifica fêmeas vazias há mais de 180 dias.
   * Alerta RECORRENTE.
   */
  async verificarFemeasVazias(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando fêmeas vazias${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      const idadeMinimaReproducao = new Date();
      idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - AlertaConstants.IDADE_MINIMA_REPRODUCAO_MESES);

      const femeas = await this.bufaloRepo.buscarFemeasAptasReproducao(idadeMinimaReproducao, id_propriedade);

      if (!femeas || femeas.length === 0) {
        this.logger.log('Nenhuma fêmea apta encontrada.');
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const femea of femeas) {
        try {
          const diasSemCobertura = await this.calcularDiasSemCobertura(femea.idBufalo, hoje);

          if (diasSemCobertura >= AlertaConstants.DIAS_SEM_COBERTURA_FEMEA_VAZIA || diasSemCobertura === Infinity) {
            const alertaCriado = await this.criarAlertaFemeaVazia(femea, diasSemCobertura, hoje);
            if (alertaCriado) alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar fêmea ${femea.idBufalo}:`, error);
        }
      }

      this.logger.log(`Verificação de fêmeas vazias concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de fêmeas vazias:', error);
      return 0;
    }
  }

  /**
   * Calcula quantos dias a fêmea está sem cobertura.
   */
  private async calcularDiasSemCobertura(id_bufala: string, hoje: Date): Promise<number> {
    const ultimaCobertura = await this.reproducaoRepo.buscarUltimaCobertura(id_bufala);

    if (!ultimaCobertura) {
      // Nunca foi coberta
      return Infinity;
    }

    if (ultimaCobertura.status === 'Confirmada') {
      // Gestante, não deve alertar
      return 0;
    }

    // Status "Falhou" ou "Concluída" - calcular dias desde última cobertura
    const dtUltimaCobertura = new Date(ultimaCobertura.dtEvento);
    return Math.floor((hoje.getTime() - dtUltimaCobertura.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Cria alerta de fêmea vazia (recorrente).
   */
  private async criarAlertaFemeaVazia(femea: any, diasSemCobertura: number, hoje: Date): Promise<boolean> {
    try {
      let grupoNome = 'Não informado';
      if (femea.idGrupo) {
        const nomeGrupo = await this.bufaloRepo.buscarNomeGrupo(femea.idGrupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      if (femea.idPropriedade) {
        const nomeProp = await this.bufaloRepo.buscarNomePropriedade(femea.idPropriedade);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      const mensagem =
        diasSemCobertura === Infinity
          ? `Fêmea ${femea.nome} apta para reprodução mas nunca foi coberta.`
          : `Fêmea ${femea.nome} sem cobertura há ${diasSemCobertura} dias.`;

      const descricaoClinica =
        diasSemCobertura === Infinity
          ? `Fêmea ${femea.nome} com ${calcularIdadeEmMeses(femea.dtNascimento)} meses de idade, apta para reprodução, porém nunca foi submetida a cobertura ou inseminação. Animal em idade reprodutiva ideal necessitando avaliação de aptidão e planejamento reprodutivo.`
          : `Fêmea ${femea.nome} com ${calcularIdadeEmMeses(femea.dtNascimento)} meses está sem cobertura há ${diasSemCobertura} dias. Animal em idade reprodutiva necessitando avaliação de aptidão e planejamento de nova cobertura/inseminação.`;

      const alertaDto: CreateAlertaDto = {
        animal_id: femea.idBufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: femea.idPropriedade,
        motivo: mensagem,
        nicho: NichoAlerta.REPRODUCAO,
        data_alerta: hoje.toISOString().split('T')[0],
        texto_ocorrencia_clinica: descricaoClinica,
        observacao: `Avaliar aptidão reprodutiva e planejar cobertura/inseminação. Idade: ${calcularIdadeEmMeses(femea.dtNascimento)} meses.`,
        id_evento_origem: femea.idBufalo,
        tipo_evento_origem: 'FEMEA_VAZIA',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de fêmea vazia:', error);
      return false;
    }
  }
}
