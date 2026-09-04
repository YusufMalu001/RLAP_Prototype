-- AlterTable
ALTER TABLE "LabTest" ADD COLUMN     "payAtReceptionEligible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RadiologyExam" ADD COLUMN     "payAtReceptionEligible" BOOLEAN NOT NULL DEFAULT true;
