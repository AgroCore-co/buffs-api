CREATE UNIQUE INDEX IF NOT EXISTS "uq_dadosreproducao_bufala_em_andamento" ON "dadosreproducao" USING btree ("id_bufala")
WHERE "status" = 'Em andamento'
  AND "deleted_at" IS NULL;