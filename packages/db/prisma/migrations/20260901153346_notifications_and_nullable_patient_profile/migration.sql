-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP');

-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "dobOrAge" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SentNotification" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentNotification_bookingId_idx" ON "SentNotification"("bookingId");

-- AddForeignKey
ALTER TABLE "SentNotification" ADD CONSTRAINT "SentNotification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
