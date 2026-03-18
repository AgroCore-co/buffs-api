import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { GeminiService } from 'src/core/gemini/gemini.service';
import { RabbitMQPatterns } from 'src/core/rabbitmq/rabbitmq.constants';
import { AlertasService } from '../alerta.service';

const GEMINI_TIMEOUT_MS = 10_000;

/**
 * Payload emitido pelo AlertasService quando um alerta é criado.
 */
export interface AlertaCriadoPayload {
  id_alerta: string;
  nicho: string;
  prioridade?: string | null;
  titulo: string;
  descricao?: string | null;
  texto_ocorrencia_clinica?: string | null;
  data_ocorrencia: string;
  animal_id?: string | null;
  id_propriedade?: string | null;
  grupo?: string | null;
}

/** Tipagem mínima do canal RabbitMQ obtido via RmqContext. */
interface RmqChannel {
  ack(message: Record<string, unknown>): void;
  nack(message: Record<string, unknown>, allUpTo?: boolean, requeue?: boolean): void;
}

/**
 * Consumer unificado de alertas via RabbitMQ.
 *
 * Responsabilidades:
 *   1. Logar notificação (🚨 URGENTE / 📬 Normal)
 *   2. Se prioridade for nula → classificar com Gemini IA → atualizar banco
 *   3. Ack/Nack manual para resiliência (DLX em caso de falha permanente)
 *
 * Usa @nestjs/microservices nativo — sem amqplib manual.
 */
@Controller()
export class AlertasConsumer {
  private readonly logger = new Logger(AlertasConsumer.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly alertasService: AlertasService,
  ) {}

  @EventPattern(RabbitMQPatterns.ALERTA_CRIADO)
  async handleAlertaCriado(@Payload() data: AlertaCriadoPayload, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef() as RmqChannel;
    const originalMsg = context.getMessage();

    try {
      // ── 1. Notificação ────────────────────────────────────────
      const prioridade = (data.prioridade ?? 'PENDENTE').toUpperCase();
      const prefixo = prioridade === 'ALTA' ? '🚨 URGENTE' : prioridade === 'PENDENTE' ? '🤖 Aguardando IA' : '📬 Normal';

      this.logger.log(`${prefixo} | alerta=${data.id_alerta} | nicho=${data.nicho} | prioridade=${prioridade} | titulo=${data.titulo}`);

      // ── 2. Classificação com IA (apenas se prioridade nula) ───
      if (!data.prioridade) {
        await this.classificarComIA(data);
      }

      // ── 3. Ack ────────────────────────────────────────────────
      channel.ack(originalMsg);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao processar alerta ${data.id_alerta}: ${msg}`);

      // Nack sem requeue → mensagem vai para DLX/DLQ
      channel.nack(originalMsg, false, false);
    }
  }

  /**
   * Chama Gemini para classificar a prioridade e atualiza o banco.
   * Timeout de 10s para não travar a fila.
   */
  private async classificarComIA(data: AlertaCriadoPayload): Promise<void> {
    const texto = (data.texto_ocorrencia_clinica ?? data.descricao ?? data.titulo ?? 'Alerta sem descrição').toString();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout Gemini (10s)')), GEMINI_TIMEOUT_MS);
    });

    const prioridade = await Promise.race([this.geminiService.classificarPrioridadeOcorrencia(texto), timeoutPromise]);
    await this.alertasService.atualizarPrioridade(data.id_alerta, prioridade);

    this.logger.log(`🤖 IA classificou alerta ${data.id_alerta} → ${prioridade}`);
  }
}
