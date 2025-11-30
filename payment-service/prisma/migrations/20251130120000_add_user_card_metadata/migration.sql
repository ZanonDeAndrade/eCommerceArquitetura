-- Add missing payment fields for kafka flow
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "cardNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Backfill existing rows to avoid NOT NULL violation
UPDATE "Payment" SET "userId" = COALESCE("userId", 0);

-- Enforce not null on userId as per schema
ALTER TABLE "Payment" ALTER COLUMN "userId" SET NOT NULL;
