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
  type Patient,
} from "./generated/client/index.js";

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

// Matches apps/web/lib/session.ts's hardcoded ADMIN account — the unified /login page checks
// these credentials against this same seeded AdminUser row (via the API's real admin login),
// so the two must stay in sync.
const DEV_ADMIN_EMAIL = "admin@gmail.com";
const DEV_ADMIN_PASSWORD = "admin@123";

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
  {
    name: "2D Echocardiogram",
    modality: "ECG",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 2200,
  },
  {
    name: "Holter Monitoring (24 hr)",
    modality: "ECG",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: "Avoid bathing while electrodes are attached for the 24-hour period.",
    price: 2500,
  },
  // --- Ultrasound: more coverage across head/neck, chest, limbs, whole body ---
  {
    name: "USG Thyroid & Neck",
    modality: "ULTRASOUND",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 900,
  },
  {
    name: "Carotid Doppler",
    modality: "ULTRASOUND",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1600,
  },
  {
    name: "USG Chest / Pleural Effusion Study",
    modality: "ULTRASOUND",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1100,
  },
  {
    name: "USG Breast (Bilateral)",
    modality: "ULTRASOUND",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1300,
  },
  {
    name: "USG Scrotum / Testicular Doppler",
    modality: "ULTRASOUND",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1200,
  },
  {
    name: "Obstetric USG (Pregnancy Dating)",
    modality: "ULTRASOUND",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: "Arrive with a comfortably full bladder.",
    price: 1300,
  },
  {
    name: "Anomaly Scan (Level II Obstetric USG)",
    modality: "ULTRASOUND",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 2200,
  },
  {
    name: "USG Shoulder Joint",
    modality: "ULTRASOUND",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1400,
  },
  {
    name: "USG Wrist & Hand",
    modality: "ULTRASOUND",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1200,
  },
  {
    name: "USG Knee Joint",
    modality: "ULTRASOUND",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1300,
  },
  {
    name: "Venous Doppler Lower Limb (DVT Study)",
    modality: "ULTRASOUND",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1800,
  },
  {
    name: "Arterial Doppler Lower Limb",
    modality: "ULTRASOUND",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 1900,
  },
  {
    name: "Whole Abdomen + Pelvis Doppler",
    modality: "ULTRASOUND",
    bodyPartCategory: "WHOLE_BODY",
    requiresSafetyCheck: false,
    preparationInstructions: "Fasting for 6 hours prior to the scan is recommended.",
    price: 2400,
  },
  // --- X-Ray: head/neck, abdomen, upper limb, whole body ---
  {
    name: "X-Ray Skull AP/Lateral",
    modality: "XRAY",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 550,
  },
  {
    name: "X-Ray Cervical Spine",
    modality: "XRAY",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 600,
  },
  {
    name: "X-Ray Abdomen Erect",
    modality: "XRAY",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 550,
  },
  {
    name: "X-Ray Pelvis AP View",
    modality: "XRAY",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 550,
  },
  {
    name: "X-Ray Shoulder Joint",
    modality: "XRAY",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 500,
  },
  {
    name: "X-Ray Wrist Joint (Both)",
    modality: "XRAY",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 550,
  },
  {
    name: "X-Ray Elbow Joint",
    modality: "XRAY",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 500,
  },
  {
    name: "X-Ray Forearm (Radius-Ulna)",
    modality: "XRAY",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 500,
  },
  {
    name: "X-Ray Humerus",
    modality: "XRAY",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 500,
  },
  {
    name: "X-Ray Hand (Both)",
    modality: "XRAY",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 500,
  },
  {
    name: "X-Ray Finger(s)",
    modality: "XRAY",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 450,
  },
  {
    name: "X-Ray Ankle Joint (Both)",
    modality: "XRAY",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 550,
  },
  {
    name: "X-Ray Hip Joint",
    modality: "XRAY",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 600,
  },
  {
    name: "X-Ray Foot (Both)",
    modality: "XRAY",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 500,
  },
  {
    name: "X-Ray Femur",
    modality: "XRAY",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 550,
  },
  {
    name: "X-Ray Leg (Tibia-Fibula)",
    modality: "XRAY",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 550,
  },
  {
    name: "X-Ray Toe(s)",
    modality: "XRAY",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 450,
  },
  {
    name: "X-Ray Whole Spine (Scoliosis Series)",
    modality: "XRAY",
    bodyPartCategory: "WHOLE_BODY",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 900,
  },
  // --- CT: expanded coverage ---
  {
    name: "CT Paranasal Sinus (PNS)",
    modality: "CT",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 3400,
  },
  {
    name: "CT Angiography Brain (CTA)",
    modality: "CT",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: true,
    preparationInstructions: "Fast for 4-6 hours before the scan. Inform staff of any allergies.",
    price: 8500,
    payAtReceptionEligible: false,
  },
  {
    name: "HRCT Chest",
    modality: "CT",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 4200,
  },
  {
    name: "CT Pelvis Contrast",
    modality: "CT",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Fast for 4-6 hours before the scan. Inform the technician of any known allergies.",
    price: 5200,
    payAtReceptionEligible: false,
  },
  {
    name: "CT KUB (Urinary Tract Stone Protocol)",
    modality: "CT",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 3800,
  },
  {
    name: "CT Spine Lumbar",
    modality: "CT",
    bodyPartCategory: "SPINE",
    requiresSafetyCheck: false,
    preparationInstructions: null,
    price: 4500,
  },
  {
    name: "CT Whole Body (Trauma / Staging Protocol)",
    modality: "CT",
    bodyPartCategory: "WHOLE_BODY",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Fast for 4-6 hours before the scan. Inform the technician of any known allergies.",
    price: 12500,
    payAtReceptionEligible: false,
  },
  // --- MRI: expanded coverage ---
  {
    name: "MRI Brain Contrast",
    modality: "MRI",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 8200,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Cervical Spine",
    modality: "MRI",
    bodyPartCategory: "HEAD_NECK",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 7200,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Cardiac",
    modality: "MRI",
    bodyPartCategory: "CHEST_CARDIAC",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 11500,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Whole Abdomen",
    modality: "MRI",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Fast for 4-6 hours prior. Remove all metallic objects before the scan.",
    price: 8800,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Pelvis",
    modality: "MRI",
    bodyPartCategory: "ABDOMEN_PELVIS",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 8000,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Shoulder Joint",
    modality: "MRI",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 6900,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Wrist Joint",
    modality: "MRI",
    bodyPartCategory: "UPPER_LIMB",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 6500,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Ankle Joint",
    modality: "MRI",
    bodyPartCategory: "LOWER_LIMB",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 6700,
    payAtReceptionEligible: false,
  },
  {
    name: "MRI Whole Spine Screening",
    modality: "MRI",
    bodyPartCategory: "WHOLE_BODY",
    requiresSafetyCheck: true,
    preparationInstructions:
      "Remove all metallic objects before the scan. Inform staff of any implants or pacemaker.",
    price: 13500,
    payAtReceptionEligible: false,
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
  // --- Biochemistry: additional individual tests ---
  {
    name: "Uric Acid",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 250,
    homeCollectionEligible: true,
  },
  {
    name: "Calcium (Serum)",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 300,
    homeCollectionEligible: true,
  },
  {
    name: "Electrolytes (Na, K, Cl)",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 450,
    homeCollectionEligible: true,
  },
  {
    name: "Iron Studies (Serum Iron, TIBC, Ferritin)",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "8 hours fasting recommended.",
    price: 1100,
    homeCollectionEligible: true,
  },
  {
    name: "Amylase & Lipase",
    category: "Biochemistry",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 650,
    homeCollectionEligible: false,
  },
  // --- Endocrinology ---
  {
    name: "Free T3, Free T4, TSH (Sensitive)",
    category: "Endocrinology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 750,
    homeCollectionEligible: true,
  },
  {
    name: "Anti-TPO Antibody",
    category: "Endocrinology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 900,
    homeCollectionEligible: true,
  },
  {
    name: "Testosterone (Total)",
    category: "Endocrinology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "Morning sample (8-10 AM) preferred.",
    price: 800,
    homeCollectionEligible: true,
  },
  {
    name: "Cortisol (AM)",
    category: "Endocrinology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "Morning sample (8-10 AM) required.",
    price: 850,
    homeCollectionEligible: true,
  },
  {
    name: "Insulin (Fasting)",
    category: "Endocrinology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "8-10 hours fasting required.",
    price: 900,
    homeCollectionEligible: true,
  },
  // --- Hematology ---
  {
    name: "Erythrocyte Sedimentation Rate (ESR)",
    category: "Hematology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 200,
    homeCollectionEligible: true,
  },
  {
    name: "Peripheral Blood Smear",
    category: "Hematology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 300,
    homeCollectionEligible: true,
  },
  {
    name: "Reticulocyte Count",
    category: "Hematology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 350,
    homeCollectionEligible: true,
  },
  // --- Vitamins & Minerals ---
  {
    name: "Vitamin B9 (Folate)",
    category: "Vitamins",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 850,
    homeCollectionEligible: true,
  },
  {
    name: "Magnesium (Serum)",
    category: "Vitamins",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 400,
    homeCollectionEligible: true,
  },
  // --- Serology / Infectious Disease ---
  {
    name: "HIV I & II Antibody (ELISA)",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 500,
    homeCollectionEligible: true,
  },
  {
    name: "Hepatitis B Surface Antigen (HBsAg)",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 400,
    homeCollectionEligible: true,
  },
  {
    name: "Hepatitis C Antibody (Anti-HCV)",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 550,
    homeCollectionEligible: true,
  },
  {
    name: "Malaria Antigen (Rapid)",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 400,
    homeCollectionEligible: true,
  },
  {
    name: "Typhidot IgM/IgG",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 550,
    homeCollectionEligible: true,
  },
  {
    name: "C-Reactive Protein (CRP)",
    category: "Serology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 500,
    homeCollectionEligible: true,
  },
  // --- Pathology ---
  {
    name: "Sputum for AFB (Smear)",
    category: "Pathology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "Early morning sample preferred.",
    price: 250,
    homeCollectionEligible: false,
  },
  {
    name: "Pap Smear",
    category: "Pathology",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: "Avoid scheduling during menstruation.",
    price: 600,
    homeCollectionEligible: false,
  },
  // --- Tumour markers ---
  {
    name: "PSA (Prostate Specific Antigen)",
    category: "Oncology Markers",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 900,
    homeCollectionEligible: true,
  },
  {
    name: "CA-125",
    category: "Oncology Markers",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 1200,
    homeCollectionEligible: true,
  },
  {
    name: "CEA (Carcinoembryonic Antigen)",
    category: "Oncology Markers",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 1100,
    homeCollectionEligible: true,
  },
  // --- Allergy ---
  {
    name: "Allergy Panel — Food (24 parameters)",
    category: "Allergy",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 3500,
    homeCollectionEligible: true,
  },
  {
    name: "Allergy Panel — Inhalant (24 parameters)",
    category: "Allergy",
    isPackage: false,
    includedParameters: [],
    preparationInstructions: null,
    price: 3500,
    homeCollectionEligible: true,
  },
  // --- More packages ---
  {
    name: "Vijaya Women's Wellness Package",
    category: "Packages",
    isPackage: true,
    includedParameters: [
      "CBC",
      "Thyroid Profile",
      "Vitamin D",
      "Vitamin B12",
      "Iron Studies",
      "Pap Smear",
    ],
    preparationInstructions: "10-12 hours fasting required.",
    price: 3499,
    homeCollectionEligible: false,
  },
  {
    name: "Vijaya Cardiac Risk Package",
    category: "Packages",
    isPackage: true,
    includedParameters: ["Lipid Profile", "HbA1c", "CRP", "Electrolytes"],
    preparationInstructions: "10-12 hours fasting required.",
    price: 2499,
    homeCollectionEligible: true,
  },
  {
    name: "Vijaya Senior Citizen Package",
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
      "PSA",
      "ESR",
    ],
    preparationInstructions: "10-12 hours fasting required.",
    price: 5999,
    homeCollectionEligible: true,
    payAtReceptionEligible: false,
  },
  {
    name: "Vijaya Fever Profile Package",
    category: "Packages",
    isPackage: true,
    includedParameters: ["CBC", "CRP", "Malaria Antigen", "Widal Test", "Dengue NS1 Antigen"],
    preparationInstructions: null,
    price: 1799,
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

// Hourly appointment slots — every day runs 10:00-22:00, except Sunday which runs a
// shorter 12:00-20:00 day.
function hourlySlotTimes(startHour: number, endHour: number): Array<[number, number, number, number]> {
  const slots: Array<[number, number, number, number]> = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push([h, 0, h + 1, 0]);
  }
  return slots;
}

const WEEKDAY_RADIOLOGY_SLOT_TIMES = hourlySlotTimes(10, 22);
const SUNDAY_RADIOLOGY_SLOT_TIMES = hourlySlotTimes(12, 20);
const WEEKDAY_LAB_SLOT_TIMES = hourlySlotTimes(10, 22);
const SUNDAY_LAB_SLOT_TIMES = hourlySlotTimes(12, 20);
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
      const isSunday = date.getUTCDay() === 0;
      const radiologySlotTimes = isSunday
        ? SUNDAY_RADIOLOGY_SLOT_TIMES
        : WEEKDAY_RADIOLOGY_SLOT_TIMES;
      const labSlotTimes = isSunday ? SUNDAY_LAB_SLOT_TIMES : WEEKDAY_LAB_SLOT_TIMES;
      if (config.offersRadiology) {
        for (const [sh, sm, eh, em] of radiologySlotTimes) {
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
        for (const [sh, sm, eh, em] of labSlotTimes) {
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
  // Bulk sample bookings — every booking type, status, payment method, and
  // collection-mode combination the catalogue actually supports, generated per
  // centre from that centre's real (exclusion-aware) offerings rather than a
  // hand-picked handful, so the admin dashboard/bookings pages demo richly
  // instead of empty.
  // -------------------------------------------------------------------------

  console.log("Creating sample patients and bulk bookings...");

  const SAMPLE_PATIENTS: Array<{
    mobileNumber: string;
    name: string;
    dobOrAge: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    email?: string;
  }> = [
    { mobileNumber: "9876500001", name: "Ananya Sharma", dobOrAge: "34", gender: "FEMALE", email: "ananya.sharma@example.com" },
    { mobileNumber: "9876500002", name: "Rohit Verma", dobOrAge: "1990-05-12", gender: "MALE" },
    { mobileNumber: "9876500003", name: "Priya Reddy", dobOrAge: "27", gender: "FEMALE", email: "priya.reddy@example.com" },
    { mobileNumber: "9876500004", name: "Karthik Rao", dobOrAge: "45", gender: "MALE" },
    { mobileNumber: "9876500005", name: "Sneha Iyer", dobOrAge: "31", gender: "FEMALE", email: "sneha.iyer@example.com" },
    { mobileNumber: "9876500006", name: "Arjun Nair", dobOrAge: "52", gender: "MALE" },
    { mobileNumber: "9876500007", name: "Divya Menon", dobOrAge: "29", gender: "FEMALE" },
    { mobileNumber: "9876500008", name: "Vikram Singh", dobOrAge: "60", gender: "MALE", email: "vikram.singh@example.com" },
    { mobileNumber: "9876500009", name: "Meera Pillai", dobOrAge: "38", gender: "FEMALE" },
    { mobileNumber: "9876500010", name: "Suresh Kumar", dobOrAge: "41", gender: "MALE" },
    { mobileNumber: "9876500011", name: "Lakshmi Narayan", dobOrAge: "23", gender: "FEMALE" },
    { mobileNumber: "9876500012", name: "Aditya Joshi", dobOrAge: "55", gender: "MALE", email: "aditya.joshi@example.com" },
    { mobileNumber: "9876500013", name: "Kavya Krishnan", dobOrAge: "1985-11-02", gender: "FEMALE" },
    { mobileNumber: "9876500014", name: "Manoj Gupta", dobOrAge: "48", gender: "MALE" },
    { mobileNumber: "9876500015", name: "Ritu Agarwal", dobOrAge: "36", gender: "FEMALE" },
    { mobileNumber: "9876500016", name: "Farhan Ahmed", dobOrAge: "33", gender: "MALE" },
    { mobileNumber: "9876500017", name: "Alex Fernandes", dobOrAge: "40", gender: "OTHER" },
    { mobileNumber: "9876500018", name: "Nisha Bhatt", dobOrAge: "26", gender: "FEMALE" },
  ];

  const patients: Patient[] = [];
  for (const p of SAMPLE_PATIENTS) {
    patients.push(await prisma.patient.create({ data: { organizationId: org.id, ...p } }));
  }

  function eligibleRadiologyForCentre(centreName: string): RadiologyExam[] {
    const config = centreConfigByName.get(centreName)!;
    if (!config.offersRadiology) return [];
    const excluded = new Set(config.radiologyExclude);
    return radiologyExams.filter((e) => !excluded.has(e.name));
  }

  function eligibleLabForCentre(centreName: string): LabTest[] {
    const config = centreConfigByName.get(centreName)!;
    if (!config.offersLab) return [];
    const excluded = new Set(config.labExclude);
    return labTests.filter((t) => !excluded.has(t.name));
  }

  async function slotFor(centreId: string, type: SlotType, dayIndex: number) {
    const date = dateOnly(dayIndex % SLOT_DAYS);
    return prisma.slot.findFirstOrThrow({ where: { centreId, type, date } });
  }

  const STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
  const PAYMENT_METHODS = ["ONLINE", "PAY_AT_RECEPTION"] as const;
  const NOTIFICATION_CHANNELS = ["SMS", "EMAIL", "WHATSAPP"] as const;

  let bookingCounter = 0;
  let patientCursor = 0;
  function nextPatient() {
    const patient = patients[patientCursor % patients.length]!;
    patientCursor += 1;
    return patient;
  }

  interface GeneratedBooking {
    centreId: string;
    type: "RADIOLOGY" | "LAB" | "COMBINED";
    status: (typeof STATUSES)[number];
    paymentMethod: (typeof PAYMENT_METHODS)[number];
    collectionMode: "CENTRE_VISIT" | "HOME_COLLECTION" | null;
    lineItems: Array<{ item: RadiologyExam | LabTest; kind: "RADIOLOGY_EXAM" | "LAB_TEST" }>;
    slotTypes: SlotType[];
  }

  const generated: GeneratedBooking[] = [];

  for (const centre of centres) {
    const config = centreConfigByName.get(centre.name)!;
    const radiologyPool = eligibleRadiologyForCentre(centre.name);
    const labPool = eligibleLabForCentre(centre.name);

    const types: GeneratedBooking["type"][] = [];
    if (config.offersRadiology) types.push("RADIOLOGY");
    if (config.offersLab) types.push("LAB");
    if (config.offersRadiology && config.offersLab) types.push("COMBINED");

    for (const type of types) {
      for (const status of STATUSES) {
        for (const paymentMethod of PAYMENT_METHODS) {
          const collectionModes: Array<"CENTRE_VISIT" | "HOME_COLLECTION" | null> =
            type === "LAB" ? ["CENTRE_VISIT", "HOME_COLLECTION"] : [type === "RADIOLOGY" ? null : "CENTRE_VISIT"];

          for (const collectionMode of collectionModes) {
            const idx = generated.length;
            const lineItems: GeneratedBooking["lineItems"] = [];
            const slotTypes: SlotType[] = [];

            if (type === "RADIOLOGY" || type === "COMBINED") {
              const exam = radiologyPool[idx % radiologyPool.length]!;
              lineItems.push({ item: exam, kind: "RADIOLOGY_EXAM" });
              slotTypes.push("RADIOLOGY");
            }
            if (type === "LAB" || type === "COMBINED") {
              const test = labPool[idx % labPool.length]!;
              const test2 = labPool[(idx + 5) % labPool.length]!;
              lineItems.push({ item: test, kind: "LAB_TEST" });
              if (idx % 3 === 0 && test2.id !== test.id) {
                lineItems.push({ item: test2, kind: "LAB_TEST" });
              }
              slotTypes.push(collectionMode === "HOME_COLLECTION" ? "HOME_COLLECTION_WINDOW" : "LAB");
            }

            generated.push({
              centreId: centre.id,
              type,
              status,
              paymentMethod,
              collectionMode,
              lineItems,
              slotTypes,
            });
          }
        }
      }
    }
  }

  console.log(`  ${generated.length} bookings to create...`);

  for (const b of generated) {
    bookingCounter += 1;
    const patient = nextPatient();
    const totalAmount = b.lineItems.reduce((sum, li) => sum + Number(li.item.price), 0);

    // Backdate completed/cancelled bookings so they read as history; leave pending/confirmed
    // recent, since those represent an appointment still ahead of the patient.
    const createdDaysAgo =
      b.status === "COMPLETED" || b.status === "CANCELLED"
        ? (bookingCounter % 20) + 1
        : bookingCounter % 3;

    const booking = await prisma.booking.create({
      data: {
        bookingCode: `RLAP-DEMO${String(bookingCounter).padStart(4, "0")}`,
        organizationId: org.id,
        patientId: patient.id,
        centreId: b.centreId,
        type: b.type,
        status: b.status,
        paymentMethod: b.paymentMethod,
        collectionMode: b.collectionMode,
        totalAmount,
        createdAt: new Date(Date.now() - createdDaysAgo * 86400000),
      },
    });

    for (const li of b.lineItems) {
      await prisma.bookingLineItem.create({
        data: {
          bookingId: booking.id,
          itemType: li.kind,
          radiologyExamId: li.kind === "RADIOLOGY_EXAM" ? li.item.id : null,
          labTestId: li.kind === "LAB_TEST" ? li.item.id : null,
          priceAtBooking: Number(li.item.price),
          source: bookingCounter % 7 === 0 ? "OCR" : "MANUAL",
          ocrConfidence: bookingCounter % 7 === 0 ? (bookingCounter % 14 === 0 ? "LOW" : "HIGH") : null,
        },
      });
    }

    for (const slotType of b.slotTypes) {
      const slot = await slotFor(b.centreId, slotType, bookingCounter);
      await prisma.bookingSlot.create({
        data: { bookingId: booking.id, slotId: slot.id, slotType },
      });
    }

    // Every radiology exam requiring a safety check gets full responses; flag ALLERGIES on
    // roughly 1 in 6 so the flagged-callback path has visible examples too.
    const safetyExam = b.lineItems.find(
      (li) => li.kind === "RADIOLOGY_EXAM" && (li.item as RadiologyExam).requiresSafetyCheck,
    );
    if (safetyExam) {
      const flagged = bookingCounter % 6 === 0;
      await prisma.safetyCheckResponse.createMany({
        data: [
          { bookingId: booking.id, questionKey: "PREGNANCY", answer: "NO", flagged: false },
          { bookingId: booking.id, questionKey: "PACEMAKER", answer: "NO", flagged: false },
          { bookingId: booking.id, questionKey: "IMPLANTS", answer: "NO", flagged: false },
          {
            bookingId: booking.id,
            questionKey: "ALLERGIES",
            answer: flagged ? "YES" : "NO",
            flagged,
          },
        ],
      });
    }

    if (b.status === "CONFIRMED" || b.status === "COMPLETED") {
      const channel = NOTIFICATION_CHANNELS[bookingCounter % NOTIFICATION_CHANNELS.length]!;
      const to =
        channel === "EMAIL" ? (patient.email ?? `${patient.mobileNumber}@example.com`) : `+91${patient.mobileNumber}`;
      await prisma.sentNotification.create({
        data: {
          bookingId: booking.id,
          channel,
          to,
          subject: channel === "EMAIL" ? `Your RLAP booking ${booking.bookingCode}` : null,
          body:
            b.status === "COMPLETED"
              ? `Your RLAP booking ${booking.bookingCode} is complete — reports are ready to download.`
              : `Your RLAP booking ${booking.bookingCode} is confirmed. Reply HELP for support.`,
        },
      });
    }
  }

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
    patients: await prisma.patient.count(),
    bookings: await prisma.booking.count(),
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
