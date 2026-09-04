-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "remindersEnabled" BOOLEAN NOT NULL DEFAULT true;
