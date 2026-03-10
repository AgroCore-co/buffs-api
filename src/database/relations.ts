/* eslint-disable @typescript-eslint/no-unsafe-member-access -- Drizzle ORM relation field references resolve to `any` at declaration time */
import { relations } from 'drizzle-orm/relations';
import {
  bufalo,
  ciclolactacao,
  propriedade,
  alertas,
  usuario,
  coleta,
  industria,
  grupo,
  movlote,
  lote,
  dadoslactacao,
  estoqueleite,
  dadossanitarios,
  medicacoes,
  alimentacaodef,
  raca,
  materialgenetico,
  endereco,
  dadosreproducao,
  alimregistro,
  dadoszootecnicos,
  usuariopropriedade,
} from './schema';

export const ciclolactacaoRelations = relations(ciclolactacao, ({ one, many }) => ({
  bufalo: one(bufalo, {
    fields: [ciclolactacao.idBufala],
    references: [bufalo.idBufalo],
  }),
  propriedade: one(propriedade, {
    fields: [ciclolactacao.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  dadoslactacaos: many(dadoslactacao),
}));

export const bufaloRelations = relations(bufalo, ({ one, many }) => ({
  ciclolactacaos: many(ciclolactacao),
  alertas: many(alertas),
  dadoslactacaos: many(dadoslactacao),
  dadossanitarios: many(dadossanitarios),
  grupo: one(grupo, {
    fields: [bufalo.idGrupo],
    references: [grupo.idGrupo],
  }),
  bufalo_idMae: one(bufalo, {
    fields: [bufalo.idMae],
    references: [bufalo.idBufalo],
    relationName: 'bufalo_idMae_bufalo_idBufalo',
  }),
  bufalos_idMae: many(bufalo, {
    relationName: 'bufalo_idMae_bufalo_idBufalo',
  }),
  bufalo_idPai: one(bufalo, {
    fields: [bufalo.idPai],
    references: [bufalo.idBufalo],
    relationName: 'bufalo_idPai_bufalo_idBufalo',
  }),
  bufalos_idPai: many(bufalo, {
    relationName: 'bufalo_idPai_bufalo_idBufalo',
  }),
  propriedade: one(propriedade, {
    fields: [bufalo.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  raca: one(raca, {
    fields: [bufalo.idRaca],
    references: [raca.idRaca],
  }),
  materialgenetico_idMaeOvulo: one(materialgenetico, {
    fields: [bufalo.idMaeOvulo],
    references: [materialgenetico.idMaterial],
    relationName: 'bufalo_idMaeOvulo_materialgenetico_idMaterial',
  }),
  materialgenetico_idPaiSemen: one(materialgenetico, {
    fields: [bufalo.idPaiSemen],
    references: [materialgenetico.idMaterial],
    relationName: 'bufalo_idPaiSemen_materialgenetico_idMaterial',
  }),
  dadosreproducaos_idBufala: many(dadosreproducao, {
    relationName: 'dadosreproducao_idBufala_bufalo_idBufalo',
  }),
  dadosreproducaos_idBufalo: many(dadosreproducao, {
    relationName: 'dadosreproducao_idBufalo_bufalo_idBufalo',
  }),
  dadoszootecnicos: many(dadoszootecnicos),
  materialgeneticos: many(materialgenetico, {
    relationName: 'materialgenetico_idBufaloOrigem_bufalo_idBufalo',
  }),
}));

export const propriedadeRelations = relations(propriedade, ({ one, many }) => ({
  ciclolactacaos: many(ciclolactacao),
  alertas: many(alertas),
  coletas: many(coleta),
  movlotes: many(movlote),
  dadoslactacaos: many(dadoslactacao),
  estoqueleites: many(estoqueleite),
  alimentacaodefs: many(alimentacaodef),
  bufalos: many(bufalo),
  industrias: many(industria),
  dadosreproducaos: many(dadosreproducao),
  grupos: many(grupo),
  lotes: many(lote),
  usuario: one(usuario, {
    fields: [propriedade.idDono],
    references: [usuario.idUsuario],
  }),
  endereco: one(endereco, {
    fields: [propriedade.idEndereco],
    references: [endereco.idEndereco],
  }),
  alimregistros: many(alimregistro),
  medicacoes: many(medicacoes),
  materialgeneticos: many(materialgenetico),
  usuariopropriedades: many(usuariopropriedade),
}));

export const alertasRelations = relations(alertas, ({ one }) => ({
  bufalo: one(bufalo, {
    fields: [alertas.animalId],
    references: [bufalo.idBufalo],
  }),
  propriedade: one(propriedade, {
    fields: [alertas.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
}));

export const coletaRelations = relations(coleta, ({ one }) => ({
  usuario: one(usuario, {
    fields: [coleta.idFuncionario],
    references: [usuario.idUsuario],
  }),
  industria: one(industria, {
    fields: [coleta.idIndustria],
    references: [industria.idIndustria],
  }),
  propriedade: one(propriedade, {
    fields: [coleta.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
}));

export const usuarioRelations = relations(usuario, ({ one, many }) => ({
  coletas: many(coleta),
  dadoslactacaos: many(dadoslactacao),
  estoqueleites: many(estoqueleite),
  dadossanitarios: many(dadossanitarios),
  endereco: one(endereco, {
    fields: [usuario.idEndereco],
    references: [endereco.idEndereco],
  }),
  propriedades: many(propriedade),
  alimregistros: many(alimregistro),
  dadoszootecnicos: many(dadoszootecnicos),
  usuariopropriedades: many(usuariopropriedade),
}));

export const industriaRelations = relations(industria, ({ one, many }) => ({
  coletas: many(coleta),
  propriedade: one(propriedade, {
    fields: [industria.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
}));

export const movloteRelations = relations(movlote, ({ one }) => ({
  grupo: one(grupo, {
    fields: [movlote.idGrupo],
    references: [grupo.idGrupo],
  }),
  lote_idLoteAnterior: one(lote, {
    fields: [movlote.idLoteAnterior],
    references: [lote.idLote],
    relationName: 'movlote_idLoteAnterior_lote_idLote',
  }),
  lote_idLoteAtual: one(lote, {
    fields: [movlote.idLoteAtual],
    references: [lote.idLote],
    relationName: 'movlote_idLoteAtual_lote_idLote',
  }),
  propriedade: one(propriedade, {
    fields: [movlote.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
}));

export const grupoRelations = relations(grupo, ({ one, many }) => ({
  movlotes: many(movlote),
  bufalos: many(bufalo),
  propriedade: one(propriedade, {
    fields: [grupo.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  lotes: many(lote),
  alimregistros: many(alimregistro),
}));

export const loteRelations = relations(lote, ({ one, many }) => ({
  movlotes_idLoteAnterior: many(movlote, {
    relationName: 'movlote_idLoteAnterior_lote_idLote',
  }),
  movlotes_idLoteAtual: many(movlote, {
    relationName: 'movlote_idLoteAtual_lote_idLote',
  }),
  grupo: one(grupo, {
    fields: [lote.idGrupo],
    references: [grupo.idGrupo],
  }),
  propriedade: one(propriedade, {
    fields: [lote.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
}));

export const dadoslactacaoRelations = relations(dadoslactacao, ({ one }) => ({
  bufalo: one(bufalo, {
    fields: [dadoslactacao.idBufala],
    references: [bufalo.idBufalo],
  }),
  ciclolactacao: one(ciclolactacao, {
    fields: [dadoslactacao.idCicloLactacao],
    references: [ciclolactacao.idCicloLactacao],
  }),
  propriedade: one(propriedade, {
    fields: [dadoslactacao.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  usuario: one(usuario, {
    fields: [dadoslactacao.idUsuario],
    references: [usuario.idUsuario],
  }),
}));

export const estoqueleiteRelations = relations(estoqueleite, ({ one }) => ({
  propriedade: one(propriedade, {
    fields: [estoqueleite.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  usuario: one(usuario, {
    fields: [estoqueleite.idUsuario],
    references: [usuario.idUsuario],
  }),
}));

export const dadossanitariosRelations = relations(dadossanitarios, ({ one }) => ({
  bufalo: one(bufalo, {
    fields: [dadossanitarios.idBufalo],
    references: [bufalo.idBufalo],
  }),
  medicacoe: one(medicacoes, {
    fields: [dadossanitarios.idMedicao],
    references: [medicacoes.idMedicacao],
  }),
  usuario: one(usuario, {
    fields: [dadossanitarios.idUsuario],
    references: [usuario.idUsuario],
  }),
}));

export const medicacoesRelations = relations(medicacoes, ({ one, many }) => ({
  dadossanitarios: many(dadossanitarios),
  propriedade: one(propriedade, {
    fields: [medicacoes.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
}));

export const alimentacaodefRelations = relations(alimentacaodef, ({ one, many }) => ({
  propriedade: one(propriedade, {
    fields: [alimentacaodef.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  alimregistros: many(alimregistro),
}));

export const racaRelations = relations(raca, ({ many }) => ({
  bufalos: many(bufalo),
}));

export const materialgeneticoRelations = relations(materialgenetico, ({ one, many }) => ({
  bufalos_idMaeOvulo: many(bufalo, {
    relationName: 'bufalo_idMaeOvulo_materialgenetico_idMaterial',
  }),
  bufalos_idPaiSemen: many(bufalo, {
    relationName: 'bufalo_idPaiSemen_materialgenetico_idMaterial',
  }),
  dadosreproducaos_idOvulo: many(dadosreproducao, {
    relationName: 'dadosreproducao_idOvulo_materialgenetico_idMaterial',
  }),
  dadosreproducaos_idSemen: many(dadosreproducao, {
    relationName: 'dadosreproducao_idSemen_materialgenetico_idMaterial',
  }),
  bufalo: one(bufalo, {
    fields: [materialgenetico.idBufaloOrigem],
    references: [bufalo.idBufalo],
    relationName: 'materialgenetico_idBufaloOrigem_bufalo_idBufalo',
  }),
  propriedade: one(propriedade, {
    fields: [materialgenetico.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
}));

export const enderecoRelations = relations(endereco, ({ many }) => ({
  usuarios: many(usuario),
  propriedades: many(propriedade),
}));

export const dadosreproducaoRelations = relations(dadosreproducao, ({ one }) => ({
  bufalo_idBufala: one(bufalo, {
    fields: [dadosreproducao.idBufala],
    references: [bufalo.idBufalo],
    relationName: 'dadosreproducao_idBufala_bufalo_idBufalo',
  }),
  bufalo_idBufalo: one(bufalo, {
    fields: [dadosreproducao.idBufalo],
    references: [bufalo.idBufalo],
    relationName: 'dadosreproducao_idBufalo_bufalo_idBufalo',
  }),
  materialgenetico_idOvulo: one(materialgenetico, {
    fields: [dadosreproducao.idOvulo],
    references: [materialgenetico.idMaterial],
    relationName: 'dadosreproducao_idOvulo_materialgenetico_idMaterial',
  }),
  propriedade: one(propriedade, {
    fields: [dadosreproducao.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  materialgenetico_idSemen: one(materialgenetico, {
    fields: [dadosreproducao.idSemen],
    references: [materialgenetico.idMaterial],
    relationName: 'dadosreproducao_idSemen_materialgenetico_idMaterial',
  }),
}));

export const alimregistroRelations = relations(alimregistro, ({ one }) => ({
  alimentacaodef: one(alimentacaodef, {
    fields: [alimregistro.idAlimentDef],
    references: [alimentacaodef.idAlimentDef],
  }),
  grupo: one(grupo, {
    fields: [alimregistro.idGrupo],
    references: [grupo.idGrupo],
  }),
  propriedade: one(propriedade, {
    fields: [alimregistro.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  usuario: one(usuario, {
    fields: [alimregistro.idUsuario],
    references: [usuario.idUsuario],
  }),
}));

export const dadoszootecnicosRelations = relations(dadoszootecnicos, ({ one }) => ({
  bufalo: one(bufalo, {
    fields: [dadoszootecnicos.idBufalo],
    references: [bufalo.idBufalo],
  }),
  usuario: one(usuario, {
    fields: [dadoszootecnicos.idUsuario],
    references: [usuario.idUsuario],
  }),
}));

export const usuariopropriedadeRelations = relations(usuariopropriedade, ({ one }) => ({
  propriedade: one(propriedade, {
    fields: [usuariopropriedade.idPropriedade],
    references: [propriedade.idPropriedade],
  }),
  usuario: one(usuario, {
    fields: [usuariopropriedade.idUsuario],
    references: [usuario.idUsuario],
  }),
}));
