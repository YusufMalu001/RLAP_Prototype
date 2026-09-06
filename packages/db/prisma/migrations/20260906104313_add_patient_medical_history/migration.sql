-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('NEVER', 'FORMER', 'CURRENT');

-- CreateEnum
CREATE TYPE "AlcoholConsumption" AS ENUM ('NONE', 'OCCASIONAL', 'REGULAR');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "alcoholConsumption" "AlcoholConsumption",
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "chronicConditions" TEXT,
ADD COLUMN     "currentMedications" TEXT,
ADD COLUMN     "familyMedicalHistory" TEXT,
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "medicalNotes" TEXT,
ADD COLUMN     "smokingStatus" "SmokingStatus",
ADD COLUMN     "weightKg" INTEGER;
