ALTER TABLE "movlote"
ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;
CREATE INDEX IF NOT EXISTS "idx_movlote_deleted_at" ON "movlote" USING btree ("deleted_at" ASC NULLS LAST)
WHERE "deleted_at" IS NULL;