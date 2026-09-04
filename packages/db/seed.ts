import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";
import {
  PrismaClient,
  Modality,
  BodyPartCategory,
  SlotType,
  type RadiologyExam,
  type LabTest,
  type Centre,
} from "./generated/client";

const prisma = new PrismaClient();

// Same scrypt shape as apps/api/src/admin/passwordService.ts (kept duplicated rather than
// shared, since packages/db doesn't otherwise depend on apps/api) — any hash this produces
// verifies correctly against the admin login endpoint.
const scrypt = promisify(scryptCallback);
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

const DEV_ADMIN_EMAIL = "admin@vijayadiagnostics.test";
const DEV_ADMIN_PASSWORD = "admin123!";

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const RADIOLOGY_EXAMS: Array<{
  name: string;
  modality: Modality;
  bodyPartCategory: BodyPartCategory;
  requiresSafetyCheck: boolean;
  preparationInstructions: string | null;
  price: number;
  payAtReceptionEligible?: boolean;
}> = [
  {
    name: "USG Abdomen",
    modality: "ULTRASOUND",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: "Fasting for 6 hours prior to the scan is recommended.",
    price: 1200,
  },
  {
    name: "USG Whole Abdomen",
    modality: "ULTRASOUND",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: "Fasting for 6 hours prior to the scan is recommended.",
    price: 1500,
  },
  {
    name: "USG Pelvis",
    modality: "ULTRASOUND",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: "Arrive with a comfortably full bladder.",
    price: 1100,
  },
  {
    name: "USG KUB",
    modality: "ULTRASOUND",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: "Arrive with a comfortably full bladder.",
    price: 1000,
  },
  {
    name: "X-Ray Chest PA View",
    modality: "XRAY",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 500,
  },
  {
    name: "X-Ray Knee Joint (Both)",
    modality: "XRAY",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 600,
  },
  {
    name: "X-Ray Spine Lumbar",
    modality: "XRAY",
    bodyPartCategory: "SPINE",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 650,
  },
  {
    name: "CT Brain Plain",
    modality: "CT",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 3200,
  },
  {
    name: "CT Chest Plain",
    modality: "CT",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 4000,
  },
  {
    name: "CT Abdomen Contrast",
    modality: "CT",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Fast for 4-6 hours before the scan. Inform the technician of any known allergies.",
    price: 5500,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Brain Plain",
    modality: "MRI",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 6500,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Spine Lumbar",
    modality: "MRI",
    bodyPartCategory: "SPINE",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 7000,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Knee Joint",
    modality: "MRI",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 6800,
    payAtReceptionEligible: false,
  },
  {
    name: "ECG Resting",
    modality: "ECG",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 300,
  },
  {
    name: "ECG Stress Test (TMT)",
    modality: "ECG",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions:
      "Wear comfortable clothing and shoes suitable for walking on a treadmill.",
    price: 1800,
  },
];

const LAB_TESTS: Array<{
  name: string;
  category: string;
  isPackage: boolean;
  includedParameters: string[];
  preparationInstructions: string | null;
  price: number;
  homeCollectionEligible: boolean;
  payAtReceptionEligible?: boolean;
}> = [
  {
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 350,
    homeCollectionEligible: true,
  },
  {
    name: "Lipid Profile",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "10-12 hours fasting required.",
    price: 700,
    homeCollectionEligible: true,
  },
  {
    name: "Liver Function Test (LFT)",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "8 hours fasting recommended.",
    price: 800,
    homeCollectionEligible: true,
  },
  {
    name: "Kidney Function Test (KFT)",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 750,
    homeCollectionEligible: true,
  },
  {
    name: "Thyroid Profile (T3, T4, TSH)",
    category: "Endocrinology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 600,
    homeCollectionEligible: true,
  },
  {
    name: "Blood Sugar Fasting",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "8-10 hours fasting required.",
    price: 120,
    homeCollectionEligible: true,
  },
  {
    name: "Blood Sugar Postprandial",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "Sample collected 2 hours after a meal.",
    price: 120,
    homeCollectionEligible: true,
  },
  {
    name: "HbA1c",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 450,
    homeCollectionEligible: true,
  },
  {
    name: "Vitamin D (25-OH)",
    category: "Vitamins",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 1400,
    homeCollectionEligible: true,
  },
  {
    name: "Vitamin B12",
    category: "Vitamins",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 900,
    homeCollectionEligible: true,
  },
  {
    name: "Urine Routine & Microscopy",
    category: "Pathology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "First morning sample preferred.",
    price: 200,
    homeCollectionEligible: false,
  },
  {
    name: "Stool Routine Examination",
    category: "Pathology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 250,
    homeCollectionEligible: false,
  },
  {
    name: "Widal Test",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 300,
    homeCollectionEligible: true,
  },
  {
    name: "Dengue NS1 Antigen",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 900,
    homeCollectionEligible: true,
  },
  {
    name: "Blood Grouping & Rh Typing",
    category: "Hematology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 250,
    homeCollectionEligible: true,
  },
  {
    name: "Coagulation Profile (PT/INR)",
    category: "Hematology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 600,
    homeCollectionEligible: false,
  },
  {
    name: "Semen Analysis",
    category: "Pathology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "2-5 days of sexual abstinence recommended before sample collection.",
    price: 500,
    homeCollectionEligible: false,
  },
  {
    name: "Vijaya Basic Health Checkup Package",
    category: "Packages",
    isPackage: true,
    includedParameters: ["CBC", "Blood Sugar Fasting", "Lipid Profile", "LFT", "KFT"],
    preparationInstructions: "10-12 hours fasting required.",
    price: 1999,
    homeCollectionEligible: true,
  },
  {
    name: "Vijaya Executive Full Body Checkup Package",
    category: "Packages",
    isPackage: true,
    includedParameters: [
      "CBC",
      "Lipid Profile",
      "LFT",
      "KFT",
      "Thyroid Profile",
      "HbA1c",
      "Vitamin D",
      "Vitamin B12",
      "Urine Routine",
    ],
    preparationInstructions: "10-12 hours fasting required.",
    price: 4999,
    homeCollectionEligible: true,
    payAtReceptionEligible: false,
  },
  {
    name: "Diabetes Screening Package",
    category: "Packages",
    isPackage: true,
    includedParameters: ["Blood Sugar Fasting", "Blood Sugar Postprandial", "HbA1c"],
    preparationInstructions: "8-10 hours fasting required for the fasting component.",
    price: 999,
    homeCollectionEligible: true,
  },
];

const CENTRES: Array<{
  name: string;
  address: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  offersRadiology: boolean;
  offersLab: boolean;
  // Names excluded from this centre's catalogue (everything else in the master list is offered).
  radiologyExclude: string[];
  labExclude: string[];
}> = [
  {
    name: "Vijaya Diagnostics — Ameerpet",
    address: "6-3-1090, Ameerpet Main Road",
    city: "Hyderabad",
    area: "Ameerpet",
    lat: 17.4374,
    lng: 78.4487,
    offersRadiology: true,
    offersLab: true,
    radiologyExclude: [],
    labExclude: [],
  },
  {
    name: "Vijaya Diagnostics — Banjara Hills",
    address: "Road No. 12, Banjara Hills",
    city: "Hyderabad",
    area: "Banjara Hills",
    lat: 17.4156,
    lng: 78.4347,
    offersRadiology: true,
    offersLab: true,
    radiologyExclude: [],
    labExclude: [
      "Widal Test",
      "Dengue NS1 Antigen",
      "Semen Analysis",
      "Coagulation Profile (PT/INR)",
      "Urine Routine & Microscopy",
      "Stool Routine Examination",
    ],
  },
  {
    name: "Vijaya Diagnostics — Kukatpally",
    address: "KPHB Colony, Kukatpally",
    city: "Hyderabad",
    area: "Kukatpally",
    lat: 17.4849,
    lng: 78.4108,
    offersRadiology: false,
    offersLab: true,
    radiologyExclude: RADIOLOGY_EXAMS.map((e) => e.name), // no radiology at this centre
    labExclude: ["Semen Analysis", "Coagulation Profile (PT/INR)"],
  },
];

const SERVICEABLE_AREAS: Array<{
  pinCode: string;
  homeCollectionCharge: number;
  centreArea?: string; // if set, scopes the row to that centre instead of org-wide
}> = [
  { pinCode: "500016", homeCollectionCharge: 150 }, // Ameerpet
  { pinCode: "500018", homeCollectionCharge: 150 }, // SR Nagar
  { pinCode: "500034", homeCollectionCharge: 200 }, // Banjara Hills
  { pinCode: "500049", homeCollectionCharge: 180 }, // Miyapur
  { pinCode: "500072", homeCollectionCharge: 100, centreArea: "Kukatpally" },
  { pinCode: "500033", homeCollectionCharge: 250, centreArea: "Banjara Hills" },
];

// Per-centre price overrides layered on top of the base catalogue price — a few
// illustrative rows to prove the mechanism, not an exhaustive pricing pass.
const RADIOLOGY_PRICE_OVERRIDES: Record<string, Record<string, number>> = {
  "Vijaya Diagnostics — Banjara Hills": { "MRI Brain Plain": 6999 },
};
const LAB_PRICE_OVERRIDES: Record<string, Record<string, number>> = {
  "Vijaya Diagnostics — Kukatpally": { "Complete Blood Count (CBC)": 300 },
};

const RADIOLOGY_SLOT_TIMES: Array<[number, number, number, number]> = [
  [9, 0, 9, 30],
  [11, 0, 11, 30],
  [15, 0, 15, 30],
];
const LAB_SLOT_TIMES: Array<[number, number, number, number]> = [
  [7, 0, 7, 30],
  [9, 0, 9, 30],
  [11, 0, 11, 30],
];
const HOME_COLLECTION_WINDOWS: Array<[number, number, number, number]> = [
  [7, 0, 8, 0],
  [8, 0, 9, 0],
];

const SLOT_DAYS = 14;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateOnly(daysFromToday: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday),
  );
}

function timeOnly(hour: number, minute: number): Date {
  return new Date(Date.UTC(1970, 0, 1, hour, minute));
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function wipe() {
  await prisma.sentNotification.deleteMany();
  await prisma.bookingSlot.deleteMany();
  await prisma.safetyCheckResponse.deleteMany();
  await prisma.bookingLineItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slotHold.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.serviceableArea.deleteMany();
  await prisma.centreLabTest.deleteMany();
  await prisma.centreRadiologyExam.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.radiologyExam.deleteMany();
  await prisma.centre.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.catalogueUpsellRule.deleteMany();
  await prisma.organization.deleteMany();
}

async function main() {
  console.log("Wiping existing data...");
  await wipe();

  console.log("Creating organization...");
  const org = await prisma.organization.create({
    data: {
      name: "Vijaya Diagnostics",
      slug: "vijaya-diagnostics",
      paymentMode: "ONLINE_AND_RECEPTION",
      emailNotificationsEnabled: true,
      whatsappNotificationsEnabled: true,
      primaryColor: "#0B5FFF",
    },
  });

  console.log("Creating admin user...");
  await prisma.adminUser.create({
    data: {
      organizationId: org.id,
      email: DEV_ADMIN_EMAIL,
      passwordHash: await hashPassword(DEV_ADMIN_PASSWORD),
      name: "Vijaya Admin",
    },
  });

  console.log("Creating radiology exams...");
  const radiologyExams: RadiologyExam[] = [];
  for (const exam of RADIOLOGY_EXAMS) {
    radiologyExams.push(
      await prisma.radiologyExam.create({
        data: { ...exam, organizationId: org.id },
      }),
    );
  }
  const radiologyByName = new Map(radiologyExams.map((e) => [e.name, e]));

  console.log("Creating lab tests...");
  const labTests: LabTest[] = [];
  for (const test of LAB_TESTS) {
    labTests.push(
      await prisma.labTest.create({
        data: { ...test, organizationId: org.id },
      }),
    );
  }
  const labByName = new Map(labTests.map((t) => [t.name, t]));

  console.log("Creating centres...");
  const centres: Centre[] = [];
  for (const c of CENTRES) {
    centres.push(
      await prisma.centre.create({
        data: {
          organizationId: org.id,
          name: c.name,
          address: c.address,
          city: c.city,
          area: c.area,
          lat: c.lat,
          lng: c.lng,
          offersRadiology: c.offersRadiology,
          offersLab: c.offersLab,
        },
      }),
    );
  }
  const centreConfigByName = new Map(CENTRES.map((c) => [c.name, c]));

  console.log("Creating centre catalogue (radiology)...");
  for (const centre of centres) {
    const config = centreConfigByName.get(centre.name)!;
    if (!config.offersRadiology) continue;
    const excluded = new Set(config.radiologyExclude);
    const overrides = RADIOLOGY_PRICE_OVERRIDES[centre.name] ?? {};
    for (const exam of radiologyExams) {
      if (excluded.has(exam.name)) continue;
      await prisma.centreRadiologyExam.create({
        data: {
          centreId: centre.id,
          radiologyExamId: exam.id,
          priceOverride: overrides[exam.name] ?? null,
        },
      });
    }
  }

  console.log("Creating centre catalogue (lab)...");
  for (const centre of centres) {
    const config = centreConfigByName.get(centre.name)!;
    if (!config.offersLab) continue;
    const excluded = new Set(config.labExclude);
    const overrides = LAB_PRICE_OVERRIDES[centre.name] ?? {};
    for (const test of labTests) {
      if (excluded.has(test.name)) continue;
      await prisma.centreLabTest.create({
        data: {
          centreId: centre.id,
          labTestId: test.id,
          priceOverride: overrides[test.name] ?? null,
        },
      });
    }
  }

  console.log("Creating serviceable areas...");
  for (const area of SERVICEABLE_AREAS) {
    const centre = area.centreArea ? centres.find((c) => c.area === area.centreArea) : undefined;
    await prisma.serviceableArea.create({
      data: {
        organizationId: org.id,
        centreId: centre?.id ?? null,
        pinCode: area.pinCode,
        homeCollectionCharge: area.homeCollectionCharge,
      },
    });
  }

  console.log(`Creating ${SLOT_DAYS} days of slots per centre...`);
  const slotRows: Array<{
    centreId: string;
    type: SlotType;
    date: Date;
    startTime: Date;
    endTime: Date;
    capacity: number;
  }> = [];
  for (const centre of centres) {
    const config = centreConfigByName.get(centre.name)!;
    for (let day = 0; day < SLOT_DAYS; day++) {
      const date = dateOnly(day);
      if (config.offersRadiology) {
        for (const [sh, sm, eh, em] of RADIOLOGY_SLOT_TIMES) {
          slotRows.push({
            centreId: centre.id,
            type: "RADIOLOGY",
            date,
            startTime: timeOnly(sh, sm),
            endTime: timeOnly(eh, em),
            capacity: 3,
          });
        }
      }
      if (config.offersLab) {
        for (const [sh, sm, eh, em] of LAB_SLOT_TIMES) {
          slotRows.push({
            centreId: centre.id,
            type: "LAB",
            date,
            startTime: timeOnly(sh, sm),
            endTime: timeOnly(eh, em),
            capacity: 10,
          });
        }
        for (const [sh, sm, eh, em] of HOME_COLLECTION_WINDOWS) {
          slotRows.push({
            centreId: centre.id,
            type: "HOME_COLLECTION_WINDOW",
            date,
            startTime: timeOnly(sh, sm),
            endTime: timeOnly(eh, em),
            capacity: 15,
          });
        }
      }
    }
  }
  await prisma.slot.createMany({ data: slotRows });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------

  const counts = {
    organizations: await prisma.organization.count(),
    centres: await prisma.centre.count(),
    radiologyExams: await prisma.radiologyExam.count(),
    labTests: await prisma.labTest.count(),
    centreRadiologyExams: await prisma.centreRadiologyExam.count(),
    centreLabTests: await prisma.centreLabTest.count(),
    serviceableAreas: await prisma.serviceableArea.count(),
    slots: await prisma.slot.count(),
  };
  console.log("\nSeed complete:");
  console.table(counts);
  console.log(`\nAdmin portal login — email: ${DEV_ADMIN_EMAIL}  password: ${DEV_ADMIN_PASSWORD}`);

  // -------------------------------------------------------------------------
  // Prove the combined-booking centre overlap exists: find every centre that
  // offers BOTH an MRI exam and a fasting lab test, exactly as R6/C2 filtering
  // would for a cart containing "MRI Brain Plain" + "Lipid Profile" (§2.3).
  // -------------------------------------------------------------------------

  const mriBrain = radiologyByName.get("MRI Brain Plain")!;
  const lipidProfile = labByName.get("Lipid Profile")!;

  const centresOfferingBoth = await prisma.centre.findMany({
    where: {
      organizationId: org.id,
      offersRadiology: true,
      offersLab: true,
      catalogueRadiologyExams: { some: { radiologyExamId: mriBrain.id } },
      catalogueLabTests: { some: { labTestId: lipidProfile.id } },
    },
    select: { name: true, area: true },
  });

  console.log(
    `\nCentres that can fulfil a Combined booking of "${mriBrain.name}" + "${lipidProfile.name}":`,
  );
  if (centresOfferingBoth.length === 0) {
    console.log("  (none — combined booking would hit the empty state / split-booking path)");
  } else {
    for (const c of centresOfferingBoth) {
      console.log(`  - ${c.name} (${c.area})`);
    }
  }

  const kukatpally = centres.find((c) => c.area === "Kukatpally")!;
  console.log(
    `\nSanity check — Kukatpally (offersRadiology=false) correctly excluded: ${
      centresOfferingBoth.some((c) => c.area === "Kukatpally") ? "FAILED" : "confirmed"
    }`,
  );
  void kukatpally;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
