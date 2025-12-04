import { DatabaseService } from '../../../../core/database/database.service';
import { eq, desc, isNotNull, or, and, sql } from 'drizzle-orm';
import { ciclolactacao, dadosreproducao } from '../../../../database/schema';

/**
 * Utilitários para queries relacionadas à reprodução usando Drizzle ORM
 * Centraliza todas as consultas ao banco para facilitar manutenção e reutilização
 */

/**
 * Busca o ciclo de lactação ativo (mais recente) de uma búfala
 */
export async function buscarCicloAtivo(db: DatabaseService, idBufala: string) {
  try {
    const result = await db.db.query.ciclolactacao.findFirst({
      where: eq(ciclolactacao.idBufala, idBufala),
      orderBy: [desc(ciclolactacao.dtParto)],
      columns: {
        dtParto: true,
        status: true,
      },
    });

    return result || null;
  } catch (error) {
    console.error('Erro ao buscar ciclo ativo:', error);
    return null;
  }
}

/**
 * Conta o total de ciclos de lactação (partos) de uma búfala
 */
export async function contarCiclosTotais(db: DatabaseService, idBufala: string): Promise<number> {
  try {
    const result = await db.db
      .select({ count: sql<number>`count(*)::int` })
      .from(ciclolactacao)
      .where(eq(ciclolactacao.idBufala, idBufala));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Erro ao contar ciclos:', error);
    return 0;
  }
}

/**
 * Calcula o Intervalo Entre Partos (IEP) médio de uma fêmea
 * IEP = Intervalo em dias entre partos consecutivos
 *
 * @param db - DatabaseService
 * @param idBufala - ID da búfala
 * @param numeroCiclos - Número total de ciclos/partos
 * @returns IEP médio em dias (null se < 2 partos)
 */
export async function calcularIEPMedio(db: DatabaseService, idBufala: string, numeroCiclos: number): Promise<number | null> {
  if (numeroCiclos < 2) {
    return null; // Precisa de pelo menos 2 partos para calcular intervalo
  }

  try {
    const ciclos = await db.db.query.ciclolactacao.findMany({
      where: eq(ciclolactacao.idBufala, idBufala),
      orderBy: [ciclolactacao.dtParto],
      columns: {
        dtParto: true,
      },
    });

    if (!ciclos || ciclos.length < 2) {
      return null;
    }

    // Calcular intervalos entre partos consecutivos
    const intervalos: number[] = [];
    for (let i = 1; i < ciclos.length; i++) {
      const dtAnterior = new Date(ciclos[i - 1].dtParto);
      const dtAtual = new Date(ciclos[i].dtParto);
      const intervalo = Math.floor((dtAtual.getTime() - dtAnterior.getTime()) / (1000 * 60 * 60 * 24));
      intervalos.push(intervalo);
    }

    // Calcular média
    const soma = intervalos.reduce((acc, val) => acc + val, 0);
    return Math.round(soma / intervalos.length);
  } catch (error) {
    console.error('Erro ao calcular IEP médio:', error);
    return null;
  }
}

/**
 * Busca histórico de coberturas de um touro/reprodutor
 * Usa tipo_parto como indicador de sucesso (Normal/Cesárea = prenhez confirmada)
 *
 * IMPORTANTE: Diferencia entre:
 * - Monta Natural: usa id_bufalo (o próprio touro cobriu)
 * - IA/TE: usa id_semen (material genético do touro)
 *
 * @param db - DatabaseService
 * @param idReprodutor - ID do búfalo reprodutor
 * @returns Estatísticas de cobertura do reprodutor
 */
export async function buscarHistoricoCoberturasTouro(db: DatabaseService, idReprodutor: string) {
  try {
    // Buscar coberturas onde o touro foi usado (monta natural OU sêmen)
    const coberturas = await db.db.query.dadosreproducao.findMany({
      where: and(
        or(eq(dadosreproducao.idBufalo, idReprodutor), eq(dadosreproducao.idSemen, idReprodutor)),
        isNotNull(dadosreproducao.tipoParto), // Apenas coberturas com resultado definido
      ),
      columns: {
        tipoParto: true,
        dtEvento: true,
        tipoInseminacao: true,
        idBufalo: true,
        idSemen: true,
      },
    });

    // Filtrar corretamente baseado no tipo de inseminação:
    // - Monta Natural: o touro é identificado por idBufalo
    // - IA/TE: o touro é identificado por idSemen (material genético)
    const coberturasValidas =
      coberturas?.filter((c) => {
        if (c.tipoInseminacao === 'Monta Natural') {
          return c.idBufalo === idReprodutor;
        }
        // IA ou TE: verifica idSemen
        return c.idSemen === idReprodutor;
      }) || [];

    const total_coberturas = coberturasValidas.length;

    // Contar prenhezes: tipoParto = 'Normal' ou 'Cesárea' (Aborto não conta como sucesso)
    const total_prenhezes = coberturasValidas.filter((c) => c.tipoParto === 'Normal' || c.tipoParto === 'Cesárea').length;

    // Última cobertura (mais recente com resultado)
    const ultima_cobertura = coberturasValidas.length > 0 ? coberturasValidas[coberturasValidas.length - 1].dtEvento : null;

    const dias_desde_ultima = ultima_cobertura ? Math.floor((Date.now() - new Date(ultima_cobertura).getTime()) / (1000 * 60 * 60 * 24)) : null;

    return {
      total_coberturas,
      total_prenhezes,
      ultima_cobertura,
      dias_desde_ultima,
    };
  } catch (error) {
    console.error('Erro ao buscar histórico de coberturas:', error);
    return {
      total_coberturas: 0,
      total_prenhezes: 0,
      ultima_cobertura: null,
      dias_desde_ultima: null,
    };
  }
}

/**
 * Calcula estatísticas gerais do rebanho da propriedade
 * Usa tipoParto como indicador de sucesso
 *
 * @param db - DatabaseService
 * @param idPropriedade - ID da propriedade
 * @returns Total de coberturas e prenhezes confirmadas
 */
export async function estatisticasRebanho(db: DatabaseService, idPropriedade: string) {
  try {
    const coberturas = await db.db.query.dadosreproducao.findMany({
      where: and(eq(dadosreproducao.idPropriedade, idPropriedade), isNotNull(dadosreproducao.tipoParto)),
      columns: {
        tipoParto: true,
      },
    });

    const totalCoberturas = coberturas?.length || 0;
    const totalPrenhezes = coberturas?.filter((c) => c.tipoParto === 'Normal' || c.tipoParto === 'Cesárea').length || 0;

    return { totalPrenhezes, totalCoberturas };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do rebanho:', error);
    return { totalPrenhezes: 0, totalCoberturas: 0 };
  }
}
