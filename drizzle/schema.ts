import { pgTable, uuid, varchar, timestamp, index, foreignKey, integer, text, boolean, numeric, type AnyPgColumn, unique, jsonb, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const endereco = pgTable("endereco", {
	idEndereco: uuid("id_endereco").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	pais: varchar({ length: 50 }).notNull(),
	estado: varchar({ length: 50 }).notNull(),
	cidade: varchar({ length: 50 }).notNull(),
	bairro: varchar({ length: 50 }),
	rua: varchar({ length: 100 }),
	cep: varchar({ length: 10 }),
	numero: varchar({ length: 10 }),
	pontoReferencia: varchar("ponto_referencia", { length: 150 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const ciclolactacao = pgTable("ciclolactacao", {
	idCicloLactacao: uuid("id_ciclo_lactacao").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idBufala: uuid("id_bufala"),
	dtParto: timestamp("dt_parto", { withTimezone: true, mode: 'string' }).notNull(),
	padraoDias: integer("padrao_dias").notNull(),
	dtSecagemPrevista: timestamp("dt_secagem_prevista", { withTimezone: true, mode: 'string' }),
	dtSecagemReal: timestamp("dt_secagem_real", { withTimezone: true, mode: 'string' }),
	status: varchar({ length: 20 }).default('Em Lactação'),
	observacao: text(),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_ciclolactacao_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idBufala],
			foreignColumns: [bufalo.idBufalo],
			name: "cicloslactacao_id_bufala_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "cicloslactacao_id_propriedade_fkey"
		}),
]);

export const alertas = pgTable("alertas", {
	idAlerta: uuid("id_alerta").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	animalId: uuid("animal_id"),
	grupo: varchar({ length: 100 }),
	localizacao: varchar({ length: 100 }),
	motivo: text().notNull(),
	nicho: varchar({ length: 20 }).notNull(),
	dataAlerta: timestamp("data_alerta", { withTimezone: true, mode: 'string' }).notNull(),
	prioridade: varchar({ length: 20 }).notNull(),
	observacao: text(),
	visto: boolean().default(false),
	idEventoOrigem: uuid("id_evento_origem"),
	tipoEventoOrigem: varchar("tipo_evento_origem", { length: 50 }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_alerta_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.animalId],
			foreignColumns: [bufalo.idBufalo],
			name: "alerta_animal_id_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "alerta_id_propriedade_fkey"
		}),
]);

export const coleta = pgTable("coleta", {
	idColeta: uuid("id_coleta").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idIndustria: uuid("id_industria"),
	resultadoTeste: boolean("resultado_teste"),
	observacao: varchar({ length: 50 }),
	quantidade: numeric({ precision: 8, scale:  3 }),
	dtColeta: timestamp("dt_coleta", { withTimezone: true, mode: 'string' }),
	idFuncionario: uuid("id_funcionario"),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_coleta_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idFuncionario],
			foreignColumns: [usuario.idUsuario],
			name: "coleta_id_funcionario_fkey"
		}),
	foreignKey({
			columns: [table.idIndustria],
			foreignColumns: [industria.idIndustria],
			name: "coleta_id_industria_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "coleta_id_propriedade_fkey"
		}),
]);

export const movlote = pgTable("movlote", {
	idMovimento: uuid("id_movimento").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idGrupo: uuid("id_grupo"),
	idLoteAnterior: uuid("id_lote_anterior"),
	idLoteAtual: uuid("id_lote_atual"),
	dtEntrada: timestamp("dt_entrada", { withTimezone: true, mode: 'string' }).notNull(),
	dtSaida: timestamp("dt_saida", { withTimezone: true, mode: 'string' }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.idGrupo],
			foreignColumns: [grupo.idGrupo],
			name: "movlote_id_grupo_fkey"
		}),
	foreignKey({
			columns: [table.idLoteAnterior],
			foreignColumns: [lote.idLote],
			name: "movlote_id_lote_anterior_fkey"
		}),
	foreignKey({
			columns: [table.idLoteAtual],
			foreignColumns: [lote.idLote],
			name: "movlote_id_lote_atual_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "movlote_id_propriedade_fkey"
		}),
]);

export const dadoslactacao = pgTable("dadoslactacao", {
	idLact: uuid("id_lact").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idBufala: uuid("id_bufala"),
	idUsuario: uuid("id_usuario"),
	idCicloLactacao: uuid("id_ciclo_lactacao"),
	qtOrdenha: numeric("qt_ordenha", { precision: 8, scale:  3 }),
	periodo: varchar({ length: 1 }),
	ocorrencia: varchar({ length: 50 }),
	dtOrdenha: timestamp("dt_ordenha", { withTimezone: true, mode: 'string' }).notNull(),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.idBufala],
			foreignColumns: [bufalo.idBufalo],
			name: "dadoslactacao_id_bufala_fkey"
		}),
	foreignKey({
			columns: [table.idCicloLactacao],
			foreignColumns: [ciclolactacao.idCicloLactacao],
			name: "dadoslactacao_id_ciclo_lactacao_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "dadoslactacao_id_propriedade_fkey"
		}),
	foreignKey({
			columns: [table.idUsuario],
			foreignColumns: [usuario.idUsuario],
			name: "dadoslactacao_id_usuario_fkey"
		}),
]);

export const estoqueleite = pgTable("estoqueleite", {
	idEstoque: uuid("id_estoque").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idPropriedade: uuid("id_propriedade"),
	idUsuario: uuid("id_usuario"),
	quantidade: numeric({ precision: 10, scale:  3 }),
	dtRegistro: timestamp("dt_registro", { withTimezone: true, mode: 'string' }),
	observacao: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_estoqueleite_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "estoqueleite_id_propriedade_fkey"
		}),
	foreignKey({
			columns: [table.idUsuario],
			foreignColumns: [usuario.idUsuario],
			name: "estoqueleite_id_usuario_fkey"
		}),
]);

export const dadossanitarios = pgTable("dadossanitarios", {
	idSanit: uuid("id_sanit").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idBufalo: uuid("id_bufalo"),
	idUsuario: uuid("id_usuario"),
	idMedicao: uuid("id_medicao"),
	dtAplicacao: timestamp("dt_aplicacao", { withTimezone: true, mode: 'string' }).notNull(),
	dosagem: numeric({ precision: 8, scale:  2 }),
	unidadeMedida: varchar("unidade_medida", { length: 20 }),
	doenca: varchar({ length: 100 }),
	necessitaRetorno: boolean("necessita_retorno"),
	dtRetorno: timestamp("dt_retorno", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	observacao: varchar({ length: 255 }),
}, (table) => [
	index("idx_dadossanitarios_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idBufalo],
			foreignColumns: [bufalo.idBufalo],
			name: "dadossanitarios_id_bufalo_fkey"
		}),
	foreignKey({
			columns: [table.idMedicao],
			foreignColumns: [medicacoes.idMedicacao],
			name: "dadossanitarios_id_medicacao_fkey"
		}),
	foreignKey({
			columns: [table.idUsuario],
			foreignColumns: [usuario.idUsuario],
			name: "dadossanitarios_id_usuario_fkey"
		}),
]);

export const alimentacaodef = pgTable("alimentacaodef", {
	idAlimentDef: uuid("id_aliment_def").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	tipoAlimentacao: varchar("tipo_alimentacao", { length: 50 }).notNull(),
	descricao: varchar({ length: 200 }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_alimentacaodef_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "alimentacaodef_id_propriedade_fkey"
		}),
]);

export const bufalo = pgTable("bufalo", {
	idBufalo: uuid("id_bufalo").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	nome: varchar({ length: 20 }),
	brinco: varchar({ length: 10 }),
	microchip: varchar({ length: 50 }),
	dtNascimento: timestamp("dt_nascimento", { withTimezone: true, mode: 'string' }),
	nivelMaturidade: varchar("nivel_maturidade", { length: 1 }),
	sexo: varchar({ length: 1 }),
	dataBaixa: timestamp("data_baixa", { withTimezone: true, mode: 'string' }),
	status: boolean(),
	motivoInativo: varchar("motivo_inativo", { length: 100 }),
	idRaca: uuid("id_raca"),
	idPropriedade: uuid("id_propriedade"),
	idGrupo: uuid("id_grupo"),
	origem: varchar({ length: 10 }),
	brincoOriginal: varchar("brinco_original", { length: 10 }),
	registroProv: varchar("registro_prov", { length: 10 }),
	registroDef: varchar("registro_def", { length: 10 }),
	categoria: varchar({ length: 3 }),
	idPai: uuid("id_pai"),
	idMae: uuid("id_mae"),
	idPaiSemen: uuid("id_pai_semen"),
	idMaeOvulo: uuid("id_mae_ovulo"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_bufalo_brinco").using("btree", table.brinco.asc().nullsLast().op("text_ops")),
	index("idx_bufalo_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_bufalo_grupo").using("btree", table.idGrupo.asc().nullsLast().op("uuid_ops")),
	index("idx_bufalo_mae").using("btree", table.idMae.asc().nullsLast().op("uuid_ops")),
	index("idx_bufalo_pai").using("btree", table.idPai.asc().nullsLast().op("uuid_ops")),
	index("idx_bufalo_propriedade").using("btree", table.idPropriedade.asc().nullsLast().op("uuid_ops")),
	index("idx_bufalo_raca").using("btree", table.idRaca.asc().nullsLast().op("uuid_ops")),
	index("idx_bufalo_sexo").using("btree", table.sexo.asc().nullsLast().op("text_ops")),
	index("idx_bufalo_status").using("btree", table.status.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.idGrupo],
			foreignColumns: [grupo.idGrupo],
			name: "bufalo_id_grupo_fkey"
		}),
	foreignKey({
			columns: [table.idMae],
			foreignColumns: [table.idBufalo],
			name: "bufalo_id_mae_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.idPai],
			foreignColumns: [table.idBufalo],
			name: "bufalo_id_pai_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "bufalo_id_propriedade_fkey"
		}),
	foreignKey({
			columns: [table.idRaca],
			foreignColumns: [raca.idRaca],
			name: "bufalo_id_raca_fkey"
		}),
	foreignKey({
			columns: [table.idMaeOvulo],
			foreignColumns: [materialgenetico.idMaterial],
			name: "fk_mae_ovulo"
		}),
	foreignKey({
			columns: [table.idPaiSemen],
			foreignColumns: [materialgenetico.idMaterial],
			name: "fk_pai_semen"
		}),
]);

export const usuario = pgTable("usuario", {
	idUsuario: uuid("id_usuario").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	authId: varchar("auth_id", { length: 255 }).notNull(),
	nome: varchar({ length: 100 }).notNull(),
	telefone: varchar({ length: 15 }),
	email: varchar({ length: 100 }),
	cargo: varchar({ length: 50 }),
	idEndereco: uuid("id_endereco"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.idEndereco],
			foreignColumns: [endereco.idEndereco],
			name: "usuario_id_endereco_fkey"
		}),
	unique("usuario_auth_id_key").on(table.authId),
]);

export const industria = pgTable("industria", {
	idIndustria: uuid("id_industria").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	nome: varchar({ length: 20 }),
	representante: varchar({ length: 20 }),
	contato: varchar({ length: 20 }),
	observacao: varchar({ length: 50 }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_industria_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "industria_id_propriedade_fkey"
		}),
]);

export const dadosreproducao = pgTable("dadosreproducao", {
	idReproducao: uuid("id_reproducao").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idOvulo: uuid("id_ovulo"),
	idSemen: uuid("id_semen"),
	idBufala: uuid("id_bufala"),
	idBufalo: uuid("id_bufalo"),
	tipoInseminacao: varchar("tipo_inseminacao", { length: 50 }),
	status: varchar({ length: 20 }),
	tipoParto: varchar("tipo_parto", { length: 20 }),
	dtEvento: timestamp("dt_evento", { withTimezone: true, mode: 'string' }).notNull(),
	ocorrencia: varchar({ length: 255 }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_dadosreproducao_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idBufala],
			foreignColumns: [bufalo.idBufalo],
			name: "dadosreproducao_id_bufala_fkey"
		}),
	foreignKey({
			columns: [table.idBufalo],
			foreignColumns: [bufalo.idBufalo],
			name: "dadosreproducao_id_bufalo_fkey"
		}),
	foreignKey({
			columns: [table.idOvulo],
			foreignColumns: [materialgenetico.idMaterial],
			name: "dadosreproducao_id_ovulo_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "dadosreproducao_id_propriedade_fkey"
		}),
	foreignKey({
			columns: [table.idSemen],
			foreignColumns: [materialgenetico.idMaterial],
			name: "dadosreproducao_id_semen_fkey"
		}),
]);

export const grupo = pgTable("grupo", {
	idGrupo: uuid("id_grupo").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	nomeGrupo: varchar("nome_grupo", { length: 50 }).notNull(),
	color: varchar({ length: 7 }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_grupo_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "grupo_id_propriedade_fkey"
		}),
]);

export const raca = pgTable("raca", {
	idRaca: uuid("id_raca").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	nome: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_raca_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const lote = pgTable("lote", {
	idLote: uuid("id_lote").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	tipoLote: varchar("tipo_lote", { length: 100 }),
	nomeLote: varchar("nome_lote", { length: 100 }).notNull(),
	idPropriedade: uuid("id_propriedade"),
	status: varchar({ length: 20 }),
	descricao: varchar({ length: 200 }),
	qtdMax: integer("qtd_max"),
	geoMapa: jsonb("geo_mapa"),
	areaM2: numeric("area_m2", { precision: 12, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	idGrupo: uuid("id_grupo"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_lote_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idGrupo],
			foreignColumns: [grupo.idGrupo],
			name: "lote_id_grupo_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "lote_id_propriedade_fkey"
		}),
]);

export const propriedade = pgTable("propriedade", {
	idPropriedade: uuid("id_propriedade").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	nome: varchar({ length: 100 }).notNull(),
	idDono: uuid("id_dono"),
	idEndereco: uuid("id_endereco"),
	cnpj: varchar({ length: 18 }),
	pAbcb: boolean("p_abcb"),
	tipoManejo: varchar("tipo_manejo", { length: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_propriedade_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idDono],
			foreignColumns: [usuario.idUsuario],
			name: "propriedade_id_dono_fkey"
		}),
	foreignKey({
			columns: [table.idEndereco],
			foreignColumns: [endereco.idEndereco],
			name: "propriedade_id_endereco_fkey"
		}),
]);

export const alimregistro = pgTable("alimregistro", {
	idRegistro: uuid("id_registro").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idGrupo: uuid("id_grupo"),
	idAlimentDef: uuid("id_aliment_def"),
	quantidade: numeric({ precision: 8, scale:  2 }),
	unidadeMedida: varchar("unidade_medida", { length: 20 }),
	freqDia: integer("freq_dia"),
	dtRegistro: timestamp("dt_registro", { withTimezone: true, mode: 'string' }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	idUsuario: uuid("id_usuario"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_registroalimentacao_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idAlimentDef],
			foreignColumns: [alimentacaodef.idAlimentDef],
			name: "alimregistro_id_aliment_def_fkey"
		}),
	foreignKey({
			columns: [table.idGrupo],
			foreignColumns: [grupo.idGrupo],
			name: "alimregistro_id_grupo_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "alimregistro_id_propriedade_fkey"
		}),
	foreignKey({
			columns: [table.idUsuario],
			foreignColumns: [usuario.idUsuario],
			name: "alimregistro_id_usuario_fkey"
		}),
]);

export const dadoszootecnicos = pgTable("dadoszootecnicos", {
	idZootec: uuid("id_zootec").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	idBufalo: uuid("id_bufalo"),
	idUsuario: uuid("id_usuario"),
	peso: numeric({ precision: 7, scale:  2 }),
	condicaoCorporal: numeric("condicao_corporal", { precision: 4, scale:  2 }),
	corPelagem: varchar("cor_pelagem", { length: 30 }),
	formatoChifre: varchar("formato_chifre", { length: 30 }),
	porteCorporal: varchar("porte_corporal", { length: 30 }),
	dtRegistro: timestamp("dt_registro", { withTimezone: true, mode: 'string' }).notNull(),
	tipoPesagem: varchar("tipo_pesagem", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_dadoszootecnicos_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idBufalo],
			foreignColumns: [bufalo.idBufalo],
			name: "dadoszootecnicos_id_bufalo_fkey"
		}),
	foreignKey({
			columns: [table.idUsuario],
			foreignColumns: [usuario.idUsuario],
			name: "dadoszootecnicos_id_usuario_fkey"
		}),
]);

export const medicacoes = pgTable("medicacoes", {
	idMedicacao: uuid("id_medicacao").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	tipoTratamento: varchar("tipo_tratamento", { length: 30 }),
	medicacao: varchar({ length: 30 }),
	descricao: varchar({ length: 100 }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_medicacao_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "medicacoes_id_propriedade_fkey"
		}),
]);

export const materialgenetico = pgTable("materialgenetico", {
	idMaterial: uuid("id_material").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	tipo: varchar({ length: 20 }),
	origem: varchar({ length: 20 }),
	idBufaloOrigem: uuid("id_bufalo_origem"),
	fornecedor: varchar({ length: 100 }),
	dataColeta: timestamp("data_coleta", { withTimezone: true, mode: 'string' }),
	idPropriedade: uuid("id_propriedade"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_materialgenetico_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.idBufaloOrigem],
			foreignColumns: [bufalo.idBufalo],
			name: "materialgenetico_id_bufalo_origem_fkey"
		}),
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "materialgenetico_id_propriedade_fkey"
		}),
]);

export const usuariopropriedade = pgTable("usuariopropriedade", {
	idUsuario: uuid("id_usuario").notNull(),
	idPropriedade: uuid("id_propriedade").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.idPropriedade],
			foreignColumns: [propriedade.idPropriedade],
			name: "usuariopropriedade_id_propriedade_fkey"
		}),
	foreignKey({
			columns: [table.idUsuario],
			foreignColumns: [usuario.idUsuario],
			name: "usuariopropriedade_id_usuario_fkey"
		}),
	primaryKey({ columns: [table.idUsuario, table.idPropriedade], name: "usuariopropriedade_pkey"}),
]);
