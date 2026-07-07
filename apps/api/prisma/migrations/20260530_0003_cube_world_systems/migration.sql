-- AlterTable
ALTER TABLE "World" ADD COLUMN     "blenderProjectPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "eraIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "fontPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "houdiniProjectPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "knownLocationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "knownZoneIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "touchDesignerPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "unrealProjectPaths" TEXT[] DEFAULT ARRAY[]::TEXT[];

