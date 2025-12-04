import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { bufalo, dadosreproducao } from '../../../../database/schema';
import { eq, and, inArray, isNull, desc } from 'drizzle-orm';

/**
 * Validator para regras de negócio de coberturas usando Drizzle ORM.
 *
 * **Responsabilidades:**
 * - Validar consistência de dados antes de operações CRUD
 * - Garantir regras zootécnicas (idade, intervalos, status)
 * - Prevenir duplicações e inconsistências
 */
@Injectable()
export class CoberturaValidatorDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Valida se fêmea já está prenha ou possui gestação em andamento.
   * Previne coberturas duplicadas enquanto há gestação ativa.
   */
  async validarGestacaoDuplicada(idBufala: string, dtEvento: string): Promise<void> {
    const coberturasAtivas = await this.databaseService.db
      .select({
        idReproducao: dadosreproducao.idReproducao,
        status: dadosreproducao.status,
        dtEvento: dadosreproducao.dtEvento,
      })
      .from(dadosreproducao)
      .where(
        and(
          eq(dadosreproducao.idBufala, idBufala),
          inArray(dadosreproducao.status, ['Em andamento', 'Confirmada']),
          isNull(dadosreproducao.deletedAt),
        ),
      )
      .limit(1);

    if (coberturasAtivas && coberturasAtivas.length > 0) {
      const gestacao = coberturasAtivas[0];
      const dataFormatada = gestacao.dtEvento ? new Date(gestacao.dtEvento).toLocaleDateString('pt-BR') : 'N/A';
      throw new BadRequestException(
        `Fêmea já possui gestação ${gestacao.status?.toLowerCase() || 'ativa'} (Cobertura ID: ${gestacao.idReproducao}, Data: ${dataFormatada})`,
      );
    }
  }

  /**
   * Valida idade mínima para reprodução.
   * - Fêmeas: 18 meses (primeira cobertura)
   * - Machos: 24 meses (maturidade sexual completa)
   *
   * Baseado em estudos zootécnicos para búfalos.
   */
  async validarIdadeMinimaReproducao(idAnimal: string, sexo: 'M' | 'F'): Promise<void> {
    const animal = await this.databaseService.db
      .select({
        dtNascimento: bufalo.dtNascimento,
        nome: bufalo.nome,
      })
      .from(bufalo)
      .where(eq(bufalo.idBufalo, idAnimal))
      .limit(1);

    if (!animal || animal.length === 0) {
      throw new BadRequestException(`Animal não encontrado: ${idAnimal}`);
    }

    const dados = animal[0];

    if (!dados.dtNascimento) {
      throw new BadRequestException(`Animal "${dados.nome}" não possui data de nascimento registrada`);
    }

    const birthDate = new Date(dados.dtNascimento);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());

    const minAge = sexo === 'F' ? 18 : 24;
    const animalTipo = sexo === 'F' ? 'Fêmea' : 'Macho';

    if (ageInMonths < minAge) {
      const anos = Math.floor(ageInMonths / 12);
      const meses = ageInMonths % 12;
      const idadeAtual = anos > 0 ? `${anos} ano(s) e ${meses} mês(es)` : `${meses} mês(es)`;

      throw new BadRequestException(
        `${animalTipo} "${dados.nome}" não atingiu idade mínima para reprodução. Mínimo: ${minAge} meses. Idade atual: ${idadeAtual}`,
      );
    }
  }

  /**
   * Valida idade máxima para reprodução.
   * - Fêmeas: 15 anos (declínio de fertilidade)
   * - Machos: 12 anos (redução de libido e qualidade seminal)
   *
   * Permite flexibilidade mas alerta sobre riscos reprodutivos.
   */
  async validarIdadeMaximaReproducao(idAnimal: string, sexo: 'M' | 'F'): Promise<void> {
    const animal = await this.databaseService.db
      .select({
        dtNascimento: bufalo.dtNascimento,
        nome: bufalo.nome,
      })
      .from(bufalo)
      .where(eq(bufalo.idBufalo, idAnimal))
      .limit(1);

    if (!animal || animal.length === 0) {
      return; // Animal não encontrado, outra validação já capturou
    }

    const dados = animal[0];

    if (!dados.dtNascimento) {
      return; // Sem data de nascimento, validação anterior já tratou
    }

    const birthDate = new Date(dados.dtNascimento);
    const now = new Date();
    let ageInYears = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      ageInYears--;
    }

    const maxAge = sexo === 'F' ? 15 : 12;
    const animalTipo = sexo === 'F' ? 'Fêmea' : 'Macho';

    if (ageInYears > maxAge) {
      throw new BadRequestException(
        `${animalTipo} "${dados.nome}" ultrapassou idade recomendada para reprodução. Máximo: ${maxAge} anos. Idade atual: ${ageInYears} anos`,
      );
    }
  }

  /**
   * Valida intervalo mínimo entre partos (IEP mínimo).
   * Mínimo: 12 meses (365 dias)
   *
   * Garante recuperação uterina e condição corporal adequada.
   * IEP ideal: 365-400 dias.
   *
   * Verifica coberturas que resultaram em parto (tipoParto preenchido).
   */
  async validarIntervaloEntrePartos(idBufala: string, dtEvento: string): Promise<void> {
    // Buscar último parto registrado (onde tipoParto foi preenchido)
    const ultimoParto = await this.databaseService.db
      .select({
        dtEvento: dadosreproducao.dtEvento,
        tipoParto: dadosreproducao.tipoParto,
      })
      .from(dadosreproducao)
      .where(and(eq(dadosreproducao.idBufala, idBufala), isNull(dadosreproducao.deletedAt)))
      .orderBy(desc(dadosreproducao.dtEvento))
      .limit(1);

    // Se há parto registrado, validar intervalo
    if (ultimoParto && ultimoParto.length > 0 && ultimoParto[0].tipoParto && ultimoParto[0].dtEvento) {
      const dataUltimoParto = new Date(ultimoParto[0].dtEvento);
      const dataNovaCobertura = new Date(dtEvento);

      const diffTime = dataNovaCobertura.getTime() - dataUltimoParto.getTime();
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Média de dias por mês

      if (diffMonths < 12) {
        throw new BadRequestException(
          `Intervalo mínimo entre partos é de 12 meses. Último parto: ${dataUltimoParto.toLocaleDateString('pt-BR')} (${ultimoParto[0].tipoParto}). Intervalo atual: ${diffMonths} mês(es)`,
        );
      }
    }
  } /**
   * Valida intervalo mínimo entre coberturas do mesmo reprodutor.
   * Mínimo: 3 dias (apenas para Monta Natural)
   *
   * Evita exaustão do reprodutor e queda na qualidade seminal.
   * Material genético congelado não tem restrição de uso.
   */
  async validarIntervaloUsoMacho(idMacho: string, dtEvento: string): Promise<void> {
    const ultimaCobertura = await this.databaseService.db
      .select({
        dtEvento: dadosreproducao.dtEvento,
      })
      .from(dadosreproducao)
      .where(and(eq(dadosreproducao.idBufalo, idMacho), eq(dadosreproducao.tipoInseminacao, 'Monta Natural'), isNull(dadosreproducao.deletedAt)))
      .orderBy(desc(dadosreproducao.dtEvento))
      .limit(1);

    if (ultimaCobertura && ultimaCobertura.length > 0 && ultimaCobertura[0].dtEvento) {
      const dataUltimaCobertura = new Date(ultimaCobertura[0].dtEvento);
      const dataNovaCobertura = new Date(dtEvento);

      const diffTime = dataNovaCobertura.getTime() - dataUltimaCobertura.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 3) {
        throw new BadRequestException(
          `Intervalo mínimo entre coberturas do mesmo reprodutor é de 3 dias. Última cobertura: ${dataUltimaCobertura.toLocaleDateString('pt-BR')}. Intervalo atual: ${diffDays} dia(s)`,
        );
      }
    }
  }

  /**
   * Valida se o animal está ativo e disponível para uso.
   * Verifica:
   * - Animal não foi removido (soft delete)
   * - Status ativo (não morto, não vendido, não descartado)
   */
  async validarAnimalAtivo(idAnimal: string): Promise<void> {
    const animal = await this.databaseService.db
      .select({
        status: bufalo.status,
        deletedAt: bufalo.deletedAt,
        nome: bufalo.nome,
      })
      .from(bufalo)
      .where(eq(bufalo.idBufalo, idAnimal))
      .limit(1);

    if (!animal || animal.length === 0) {
      throw new BadRequestException(`Animal não encontrado: ${idAnimal}`);
    }

    const dados = animal[0];

    if (dados.deletedAt) {
      throw new BadRequestException(`Animal "${dados.nome}" foi removido e não pode ser usado para reprodução`);
    }

    if (!dados.status) {
      throw new BadRequestException(`Animal "${dados.nome}" está inativo (morto ou fora da propriedade)`);
    }
  }

  /**
   * Executa todas as validações de negócio para uma nova cobertura.
   * Método auxiliar que centraliza validações comuns.
   *
   * @param idBufala ID da fêmea receptora
   * @param dtEvento Data do evento de cobertura
   */
  async validarNovaCobertura(idBufala: string, dtEvento: string): Promise<void> {
    // Validar fêmea ativa
    await this.validarAnimalAtivo(idBufala);

    // Validar idade mínima (18 meses)
    await this.validarIdadeMinimaReproducao(idBufala, 'F');

    // Validar idade máxima (15 anos)
    await this.validarIdadeMaximaReproducao(idBufala, 'F');

    // Prevenir gestação duplicada
    await this.validarGestacaoDuplicada(idBufala, dtEvento);

    // Validar intervalo entre partos (12 meses)
    await this.validarIntervaloEntrePartos(idBufala, dtEvento);
  }
}
