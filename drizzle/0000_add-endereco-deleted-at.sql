ALTER TABLE "endereco"
ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "idx_endereco_deleted_at" ON "endereco" USING btree ("deleted_at" timestamptz_ops)
WHERE ("deleted_at" IS NULL);