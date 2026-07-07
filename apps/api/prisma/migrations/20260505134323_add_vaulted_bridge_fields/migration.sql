-- Boveda Character: add Vaulted (RightsLayer) bridge fields
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "vaultedArtifactId" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "vaultedStatus" TEXT NOT NULL DEFAULT 'not_registered';
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "vaultedRegisteredAt" TIMESTAMP(3);
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "vaultedLastSyncedAt" TIMESTAMP(3);
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "vaultedLastError" TEXT;
CREATE INDEX IF NOT EXISTS "Character_vaultedArtifactId_idx" ON "Character"("vaultedArtifactId");
