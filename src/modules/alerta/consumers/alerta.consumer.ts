import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { AlertasService } from '../alerta.service';
import { AlertaMessage } from '../interfaces/alerta-message.interface';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../dto/create-alerta.dto';
import { RabbitMQConfig } from 'src/core/rabbitmq/rabbitmq.constants';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';

/**
 * Consumer simples para processar mensagens de alerta via RabbitMQ.
 * Apenas uma ponte: recebe mensagem, valida campos e passa para o AlertaService.
 */
@Injectable()
export class AlertaConsumer {
  private readonly logger = new Logger(AlertaConsumer.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly bufaloRepository: BufaloRepositoryDrizzle,
  ) {}

  /**
   * Processa mensagens de alerta vindas da fila RabbitMQ.
   * Apenas valida, mapeia e repassa para o AlertaService.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @RabbitSubscribe({
    exchange: RabbitMQConfig.EXCHANGE,
    routingKey: RabbitMQConfig.ALERTA_ROUTING_KEY,
    queue: RabbitMQConfig.ALERTA_QUEUE,
  })
  async handleAlertaMessage(message: AlertaMessage): Promise<void> {
    try {
      // Validar campos obrigatórios
      if (!message.tipo || !message.entidadeId || !message.mensagem || !message.severidade) {
        console.error('Mensagem inválida: campos obrigatórios faltando', message);
        return;
      }

      // Buscar informações do búfalo
      const bufalo = await this.bufaloRepository.buscarBufaloCompleto(message.entidadeId);

      if (!bufalo) {
        console.error(`Búfalo não encontrado com ID: ${message.entidadeId}`);
        return;
      }

      // Extrair informações com segurança
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const nomeGrupo = bufalo.grupo?.nomeGrupo as string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const nomePropriedade = bufalo.propriedade?.nomePropriedade as string | undefined;

      // Mapear e criar o alerta
      const createAlertaDto: CreateAlertaDto = {
        animal_id: message.entidadeId,
        grupo: nomeGrupo ?? 'Sem grupo',
        localizacao: nomePropriedade ?? 'Sem localização',
        id_propriedade: bufalo.idPropriedade,
        motivo: message.mensagem,
        nicho: this.mapTipoToNicho(message.tipo),
        data_alerta: new Date().toISOString(),
        prioridade: this.mapSeveridadeToPrioridade(message.severidade),
      };

      await this.alertasService.create(createAlertaDto);
      this.logger.log(`✓ Alerta processado: ${message.tipo} - ${message.entidadeId}`);
    } catch (error) {
      // Sem lógica de retry - apenas loga o erro
      console.error('Erro ao processar alerta:', error);
    }
  }

  /**
   * Mapeia o tipo da mensagem para o enum NichoAlerta
   */
  private mapTipoToNicho(tipo: string): NichoAlerta {
    const tipoUpper = tipo.toUpperCase();

    if (Object.values(NichoAlerta).includes(tipoUpper as NichoAlerta)) {
      return tipoUpper as NichoAlerta;
    }

    // Valor padrão caso o tipo não seja reconhecido
    this.logger.warn(`Tipo de alerta não reconhecido: ${tipo}. Usando MANEJO como padrão.`);
    return NichoAlerta.MANEJO;
  }

  /**
   * Mapeia a severidade da mensagem para o enum PrioridadeAlerta
   */
  private mapSeveridadeToPrioridade(severidade: string): PrioridadeAlerta {
    const severidadeUpper = severidade.toUpperCase();

    if (Object.values(PrioridadeAlerta).includes(severidadeUpper as PrioridadeAlerta)) {
      return severidadeUpper as PrioridadeAlerta;
    }

    // Valor padrão caso a severidade não seja reconhecida
    this.logger.warn(`Severidade não reconhecida: ${severidade}. Usando MEDIA como padrão.`);
    return PrioridadeAlerta.MEDIA;
  }
}
