-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ONLINE_ONLY', 'ONLINE_AND_RECEPTION');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('ULTRASOUND', 'XRAY', 'CT', 'MRI', 'ECG');

-- CreateEnum
CREATE TYPE "BodyPartCategory" AS ENUM ('HEAD_NECK', 'CHEST_CARDIAC', 'ABDOMEN_PELVIS', 'SPINE', 'UPPER_LIMB', 'LOWER_LIMB', 'WHOLE_BODY');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('RADIOLOGY', 'LAB', 'HOME_COLLECTION_WINDOW');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('RADIOLOGY', 'LAB', 'COMBINED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'PAY_AT_RECEPTION');

-- CreateEnum
CREATE TYPE "CollectionMode" AS ENUM ('CENTRE_VISIT', 'HOME_COLLECTION');

-- CreateEnum
CREATE TYPE "LineItemType" AS ENUM ('RADIOLOGY_EXAM', 'LAB_TEST');

-- CreateEnum
CREATE TYPE "LineItemSource" AS ENUM ('MANUAL', 'OCR');

-- CreateEnum
CREATE TYPE "OcrConfidence" AS ENUM ('HIGH', 'LOW');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'ONLINE_AND_RECEPTION',
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Centre" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "offersRadiology" BOOLEAN NOT NULL DEFAULT false,
    "offersLab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Centre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyExam" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modality" "Modality" NOT NULL,
    "bodyPartCategory" "BodyPartCategory" NOT NULL,
    "requiresSafetyCheck" BOOLEAN NOT NULL DEFAULT false,
    "preparationInstructions" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPackage" BOOLEAN NOT NULL DEFAULT false,
    "includedParameters" TEXT[],
    "preparationInstructions" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "homeCollectionEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentreRadiologyExam" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "radiologyExamId" TEXT NOT NULL,
    "priceOverride" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentreRadiologyExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentreLabTest" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "priceOverride" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentreLabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceableArea" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "centreId" TEXT,
    "pinCode" TEXT NOT NULL,
    "homeCollectionCharge" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceableArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "type" "SlotType" NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotHold" (
    "id" TEXT NOT NULL,
    "cartToken" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dobOrAge" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "collectionMode" "CollectionMode",
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingLineItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "itemType" "LineItemType" NOT NULL,
    "radiologyExamId" TEXT,
    "labTestId" TEXT,
    "priceAtBooking" DECIMAL(10,2) NOT NULL,
    "source" "LineItemSource" NOT NULL DEFAULT 'MANUAL',
    "ocrConfidence" "OcrConfidence",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSlot" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "slotType" "SlotType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCheckResponse" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyCheckResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Centre_organizationId_idx" ON "Centre"("organizationId");

-- CreateIndex
CREATE INDEX "Centre_organizationId_city_area_idx" ON "Centre"("organizationId", "city", "area");

-- CreateIndex
CREATE INDEX "RadiologyExam_organizationId_idx" ON "RadiologyExam"("organizationId");

-- CreateIndex
CREATE INDEX "RadiologyExam_organizationId_modality_idx" ON "RadiologyExam"("organizationId", "modality");

-- CreateIndex
CREATE INDEX "LabTest_organizationId_idx" ON "LabTest"("organizationId");

-- CreateIndex
CREATE INDEX "LabTest_organizationId_category_idx" ON "LabTest"("organizationId", "category");

-- CreateIndex
CREATE INDEX "CentreRadiologyExam_radiologyExamId_idx" ON "CentreRadiologyExam"("radiologyExamId");

-- CreateIndex
CREATE UNIQUE INDEX "CentreRadiologyExam_centreId_radiologyExamId_key" ON "CentreRadiologyExam"("centreId", "radiologyExamId");

-- CreateIndex
CREATE INDEX "CentreLabTest_labTestId_idx" ON "CentreLabTest"("labTestId");

-- CreateIndex
CREATE UNIQUE INDEX "CentreLabTest_centreId_labTestId_key" ON "CentreLabTest"("centreId", "labTestId");

-- CreateIndex
CREATE INDEX "ServiceableArea_organizationId_pinCode_idx" ON "ServiceableArea"("organizationId", "pinCode");

-- CreateIndex
CREATE INDEX "ServiceableArea_centreId_pinCode_idx" ON "ServiceableArea"("centreId", "pinCode");

-- CreateIndex
CREATE INDEX "Slot_centreId_date_type_idx" ON "Slot"("centreId", "date", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_centreId_type_date_startTime_key" ON "Slot"("centreId", "type", "date", "startTime");

-- CreateIndex
CREATE INDEX "SlotHold_cartToken_idx" ON "SlotHold"("cartToken");

-- CreateIndex
CREATE INDEX "SlotHold_expiresAt_idx" ON "SlotHold"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlotHold_cartToken_slotId_key" ON "SlotHold"("cartToken", "slotId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_organizationId_mobileNumber_key" ON "Patient"("organizationId", "mobileNumber");

-- CreateIndex
CREATE INDEX "OtpVerification_organizationId_mobileNumber_idx" ON "OtpVerification"("organizationId", "mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_organizationId_idx" ON "Booking"("organizationId");

-- CreateIndex
CREATE INDEX "Booking_patientId_idx" ON "Booking"("patientId");

-- CreateIndex
CREATE INDEX "Booking_centreId_idx" ON "Booking"("centreId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_status_idx" ON "Booking"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BookingLineItem_bookingId_idx" ON "BookingLineItem"("bookingId");

-- CreateIndex
CREATE INDEX "BookingLineItem_radiologyExamId_idx" ON "BookingLineItem"("radiologyExamId");

-- CreateIndex
CREATE INDEX "BookingLineItem_labTestId_idx" ON "BookingLineItem"("labTestId");

-- CreateIndex
CREATE INDEX "BookingSlot_slotId_idx" ON "BookingSlot"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSlot_bookingId_slotType_key" ON "BookingSlot"("bookingId", "slotType");

-- CreateIndex
CREATE INDEX "SafetyCheckResponse_bookingId_idx" ON "SafetyCheckResponse"("bookingId");

-- AddForeignKey
ALTER TABLE "Centre" ADD CONSTRAINT "Centre_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyExam" ADD CONSTRAINT "RadiologyExam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentreRadiologyExam" ADD CONSTRAINT "CentreRadiologyExam_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentreRadiologyExam" ADD CONSTRAINT "CentreRadiologyExam_radiologyExamId_fkey" FOREIGN KEY ("radiologyExamId") REFERENCES "RadiologyExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentreLabTest" ADD CONSTRAINT "CentreLabTest_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentreLabTest" ADD CONSTRAINT "CentreLabTest_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "LabTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceableArea" ADD CONSTRAINT "ServiceableArea_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceableArea" ADD CONSTRAINT "ServiceableArea_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpVerification" ADD CONSTRAINT "OtpVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLineItem" ADD CONSTRAINT "BookingLineItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLineItem" ADD CONSTRAINT "BookingLineItem_radiologyExamId_fkey" FOREIGN KEY ("radiologyExamId") REFERENCES "RadiologyExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLineItem" ADD CONSTRAINT "BookingLineItem_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "LabTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCheckResponse" ADD CONSTRAINT "SafetyCheckResponse_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
