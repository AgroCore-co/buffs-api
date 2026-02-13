import { Injectable, Logger } from '@nestjs/common';
import { BufaloMaturityUtils } from '../utils/maturity.utils';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { NivelMaturidade, SexoBufalo } from '../dto/create-bufalo.dto';

/**
 * Serviço de domínio para lógica de maturidade de búfalos.
 *
 * **Responsabilidades:**
 * - Calcular nível de maturidade baseado em idade
 * - Atualizar maturidade quando necessário
 * - Processar dados de maturidade antes de salvar
 */
@Injectable()
export class BufaloMaturidadeService {
  private readonly logger = new Logger(BufaloMaturidadeService.name);
  private readonly debugEnabled = process.env.LOG_LEVEL === 'debug';

  constructor(private readonly bufaloRepo: BufaloRepositoryDrizzle) {}

  /**
   * Processa dados de maturidade antes de criar/atualizar búfalo.
   * Calcula automaticamente o nível de maturidade baseado na data de nascimento.
   *
   * @param bufaloData Dados do búfalo (deve conter dt_nascimento e sexo)
   * @returns Dados processados com nivel_maturidade calculado
   */
  processarDadosMaturidade(bufaloData: any): any {
    if (!bufaloData.dt_nascimento || !bufaloData.sexo) {
      return bufaloData;
    }

    const birthDate = new Date(bufaloData.dt_nascimento);
    const sexo = bufaloData.sexo as SexoBufalo;

    const maturityInfo = BufaloMaturityUtils.getMaturityInfo(birthDate, sexo);

    return {
      ...bufaloData,
      nivel_maturidade: maturityInfo.maturityLevel,
    };
  }

  /**
   * Atualiza nível de maturidade de búfalos se necessário.
   * Verifica se a maturidade atual está correta e atualiza no banco se mudou.
   *
   * **Quando atualizar:**
   * - Bezerro → Novilho (18 meses)
   * - Novilho → Adulto (24 meses fêmeas, 30 meses machos)
   *
   * @param bufalos Array de búfalos para verificar
   * @returns Número de búfalos atualizados
   */
  async atualizarMaturidadeSeNecessario(bufalos: any[]): Promise<number> {
    if (!bufalos || bufalos.length === 0) {
      return 0;
    }

    const atualizacoes: { id_bufalo: string; nivel_maturidade: NivelMaturidade }[] = [];

    for (const bufalo of bufalos) {
      try {
        if (!bufalo.dt_nascimento || !bufalo.sexo || !bufalo.status) {
          continue; // Pula búfalos sem dados essenciais ou inativos
        }

        const birthDate = new Date(bufalo.dt_nascimento);
        const sexo = bufalo.sexo as SexoBufalo;

        const maturityInfo = BufaloMaturityUtils.getMaturityInfo(birthDate, sexo);

        // Verifica se precisa atualizar
        if (bufalo.nivel_maturidade !== maturityInfo.maturityLevel) {
          atualizacoes.push({
            id_bufalo: bufalo.id_bufalo,
            nivel_maturidade: maturityInfo.maturityLevel,
          });

          // Log apenas em modo debug (evita spam em produção)
          if (this.debugEnabled) {
            this.logger.debug(
              `Maturidade atualizada: ${bufalo.nome || bufalo.brinco} ` + `(${bufalo.nivel_maturidade} → ${maturityInfo.maturityLevel})`,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Erro ao processar maturidade do búfalo ${bufalo.id_bufalo}:`, error);
      }
    }

    // Atualiza em batch se houver mudanças
    if (atualizacoes.length > 0) {
      try {
        // Agrupa por nível de maturidade para atualizar em batch
        const porMaturidade = atualizacoes.reduce(
          (acc, item) => {
            if (!acc[item.nivel_maturidade]) {
              acc[item.nivel_maturidade] = [];
            }
            acc[item.nivel_maturidade].push(item.id_bufalo);
            return acc;
          },
          {} as Record<NivelMaturidade, string[]>,
        );

        // Atualiza cada grupo
        for (const [nivel, ids] of Object.entries(porMaturidade)) {
          await this.bufaloRepo.updateMany(ids, { nivel_maturidade: nivel });
        }

        this.logger.log(`✅ ${atualizacoes.length} búfalos tiveram maturidade atualizada`);
      } catch (error) {
        this.logger.error('Erro ao atualizar maturidade em batch:', error);
      }
    }

    return atualizacoes.length;
  }

  /**
   * Verifica se búfalo precisa de atualização de maturidade.
   * Usado para otimizar antes de fazer update no banco.
   *
   * @param bufalo Dados do búfalo
   * @returns true se precisa atualizar
   */
  precisaAtualizarMaturidade(bufalo: any): boolean {
    if (!bufalo.dt_nascimento || !bufalo.sexo) {
      return false;
    }

    const birthDate = new Date(bufalo.dt_nascimento);
    const sexo = bufalo.sexo as SexoBufalo;

    const maturityInfo = BufaloMaturityUtils.getMaturityInfo(birthDate, sexo);

    return bufalo.nivel_maturidade !== maturityInfo.maturityLevel;
  }

  /**
   * Obtém informações completas de maturidade de um búfalo.
   *
   * @param bufalo Dados do búfalo
   * @returns Informações de maturidade (nível, idade, descrição)
   */
  obterInformacoesMaturidade(bufalo: any) {
    if (!bufalo.dt_nascimento || !bufalo.sexo) {
      return null;
    }

    const birthDate = new Date(bufalo.dt_nascimento);
    const sexo = bufalo.sexo as SexoBufalo;

    return BufaloMaturityUtils.getMaturityInfo(birthDate, sexo);
  }
}
