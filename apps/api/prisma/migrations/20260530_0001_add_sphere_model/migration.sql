-- AlterEnum
ALTER TYPE "EntityTypeEnum" ADD VALUE 'SPHERE';

-- CreateTable
CREATE TABLE "Sphere" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'music_video',
    "primaryAspect" TEXT NOT NULL DEFAULT '16:9',
    "siblingAspect" TEXT,
    "intent" TEXT,
    "ikengaSeriesId" TEXT,
    "castIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioMode" TEXT NOT NULL DEFAULT 'lead',
    "stelaId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "physics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sphere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sphere_ikengaSeriesId_key" ON "Sphere"("ikengaSeriesId");

-- CreateIndex
CREATE INDEX "Sphere_sceneId_idx" ON "Sphere"("sceneId");

-- CreateIndex
CREATE INDEX "Sphere_status_idx" ON "Sphere"("status");

-- AddForeignKey
ALTER TABLE "Sphere" ADD CONSTRAINT "Sphere_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

