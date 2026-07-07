-- AlterEnum
ALTER TYPE "EntityTypeEnum" ADD VALUE 'RELIC';

-- CreateTable
CREATE TABLE "Relic" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'recording',
    "title" TEXT NOT NULL,
    "phenomenonKey" TEXT,
    "fieldSite" TEXT,
    "fieldLat" DOUBLE PRECISION,
    "fieldLng" DOUBLE PRECISION,
    "captureMethod" TEXT,
    "captureGearNotes" TEXT,
    "rawSampleUrl" TEXT,
    "taxonPath" TEXT,
    "ncbiTaxid" TEXT,
    "gbifTaxonkey" TEXT,
    "iucnStatus" TEXT,
    "habitat" TEXT,
    "occurrences" JSONB,
    "rangeGeojson" JSONB,
    "weatherAtCapture" JSONB,
    "acousticIndices" JSONB,
    "detectedSpecies" JSONB,
    "defaultScoreId" TEXT,
    "renderedOutputs" JSONB,
    "spectrogramUrl" TEXT,
    "waterfallUrl" TEXT,
    "pointCloudUrl" TEXT,
    "gisLayerUrl" TEXT,
    "tdPatchRef" TEXT,
    "unrealActorRef" TEXT,
    "strangeness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saroIndex" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mythicPosture" TEXT,
    "bodyMd" TEXT,
    "audioSamples" JSONB,
    "visualSamples" JSONB,
    "cubeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "zoneIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sphereIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stelaIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cipherIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "characterIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceProvenance" TEXT,
    "sourceUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relic_kind_idx" ON "Relic"("kind");

-- CreateIndex
CREATE INDEX "Relic_phenomenonKey_idx" ON "Relic"("phenomenonKey");

-- CreateIndex
CREATE INDEX "Relic_strangeness_idx" ON "Relic"("strangeness");

-- CreateIndex
CREATE INDEX "Relic_saroIndex_idx" ON "Relic"("saroIndex");

