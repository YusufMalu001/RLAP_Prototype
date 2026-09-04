import { Router } from "express";
import { prisma } from "@rlap/db";
import type { BodyPartCategory, Modality } from "@rlap/db";
import { asyncHandler } from "../../lib/asyncHandler";
import { HttpError } from "../../lib/httpError";

export const adminCatalogueRouter = Router();

const MODALITIES = new Set<Modality>(["ULTRASOUND", "XRAY", "CT", "MRI", "ECG"]);
const BODY_PART_CATEGORIES = new Set<BodyPartCategory>([
  "HEAD_NECK",
  "CHEST_CARDIAC",
  "ABDOMEN_PELVIS",
  "SPINE",
  "UPPER_LIMB",
  "LOWER_LIMB",
  "WHOLE_BODY",
]);

function toExamDto(exam: {
  id: string;
  name: string;
  modality: Modality;
  bodyPartCategory: BodyPartCategory;
  requiresSafetyCheck: boolean;
  preparationInstructions: string | null;
  price: unknown;
  payAtReceptionEligible: boolean;
}) {
  return { ...exam, price: Number(exam.price) };
}

function toTestDto(test: {
  id: string;
  name: string;
  category: string;
  isPackage: boolean;
  includedParameters: string[];
  preparationInstructions: string | null;
  price: unknown;
  homeCollectionEligible: boolean;
  payAtReceptionEligible: boolean;
}) {
  return { ...test, price: Number(test.price) };
}

// ---------------------------------------------------------------------------
// Radiology exams
// ---------------------------------------------------------------------------

adminCatalogueRouter.get(
  "/radiology-exams",
  asyncHandler(async (req, res) => {
    const exams = await prisma.radiologyExam.findMany({
      where: { organizationId: req.adminUser!.organizationId },
      orderBy: { name: "asc" },
    });
    res.json({ exams: exams.map(toExamDto) });
  }),
);

adminCatalogueRouter.get(
  "/radiology-exams/:id",
  asyncHandler(async (req, res) => {
    const exam = await prisma.radiologyExam.findFirst({
      where: { id: req.params.id, organizationId: req.adminUser!.organizationId },
    });
    if (!exam) throw new HttpError(404, "Radiology exam not found");
    res.json({ exam: toExamDto(exam) });
  }),
);

adminCatalogueRouter.post(
  "/radiology-exams",
  asyncHandler(async (req, res) => {
    const b = req.body ?? {};
    if (
      typeof b.name !== "string" ||
      !b.name.trim() ||
      !MODALITIES.has(b.modality) ||
      !BODY_PART_CATEGORIES.has(b.bodyPartCategory) ||
      typeof b.price !== "number"
    ) {
      throw new HttpError(400, "name, modality, bodyPartCategory and price are required");
    }
    const exam = await prisma.radiologyExam.create({
      data: {
        organizationId: req.adminUser!.organizationId,
        name: b.name.trim(),
        modality: b.modality,
        bodyPartCategory: b.bodyPartCategory,
        requiresSafetyCheck: Boolean(b.requiresSafetyCheck),
        preparationInstructions:
          typeof b.preparationInstructions === "string" ? b.preparationInstructions : null,
        price: b.price,
        payAtReceptionEligible: b.payAtReceptionEligible !== false,
      },
    });
    res.status(201).json({ exam: toExamDto(exam) });
  }),
);

adminCatalogueRouter.patch(
  "/radiology-exams/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.radiologyExam.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Radiology exam not found");

    const b = req.body ?? {};
    if (b.modality !== undefined && !MODALITIES.has(b.modality)) {
      throw new HttpError(400, `Invalid modality "${b.modality}"`);
    }
    if (b.bodyPartCategory !== undefined && !BODY_PART_CATEGORIES.has(b.bodyPartCategory)) {
      throw new HttpError(400, `Invalid bodyPartCategory "${b.bodyPartCategory}"`);
    }

    const exam = await prisma.radiologyExam.update({
      where: { id: existing.id },
      data: {
        name: typeof b.name === "string" ? b.name.trim() : undefined,
        modality: b.modality,
        bodyPartCategory: b.bodyPartCategory,
        requiresSafetyCheck:
          typeof b.requiresSafetyCheck === "boolean" ? b.requiresSafetyCheck : undefined,
        preparationInstructions:
          b.preparationInstructions === undefined ? undefined : (b.preparationInstructions ?? null),
        price: typeof b.price === "number" ? b.price : undefined,
        payAtReceptionEligible:
          typeof b.payAtReceptionEligible === "boolean" ? b.payAtReceptionEligible : undefined,
      },
    });
    res.json({ exam: toExamDto(exam) });
  }),
);

adminCatalogueRouter.delete(
  "/radiology-exams/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.radiologyExam.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Radiology exam not found");

    const lineItemCount = await prisma.bookingLineItem.count({
      where: { radiologyExamId: existing.id },
    });
    if (lineItemCount > 0) {
      throw new HttpError(409, "Cannot delete — this exam is referenced by existing bookings");
    }
    await prisma.centreRadiologyExam.deleteMany({ where: { radiologyExamId: existing.id } });
    await prisma.radiologyExam.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// Lab tests
// ---------------------------------------------------------------------------

adminCatalogueRouter.get(
  "/lab-tests",
  asyncHandler(async (req, res) => {
    const tests = await prisma.labTest.findMany({
      where: { organizationId: req.adminUser!.organizationId },
      orderBy: { name: "asc" },
    });
    res.json({ tests: tests.map(toTestDto) });
  }),
);

adminCatalogueRouter.get(
  "/lab-tests/:id",
  asyncHandler(async (req, res) => {
    const test = await prisma.labTest.findFirst({
      where: { id: req.params.id, organizationId: req.adminUser!.organizationId },
    });
    if (!test) throw new HttpError(404, "Lab test not found");
    res.json({ test: toTestDto(test) });
  }),
);

adminCatalogueRouter.post(
  "/lab-tests",
  asyncHandler(async (req, res) => {
    const b = req.body ?? {};
    if (
      typeof b.name !== "string" ||
      !b.name.trim() ||
      typeof b.category !== "string" ||
      typeof b.price !== "number"
    ) {
      throw new HttpError(400, "name, category and price are required");
    }
    const test = await prisma.labTest.create({
      data: {
        organizationId: req.adminUser!.organizationId,
        name: b.name.trim(),
        category: b.category.trim(),
        isPackage: Boolean(b.isPackage),
        includedParameters: Array.isArray(b.includedParameters)
          ? b.includedParameters.filter((p: unknown) => typeof p === "string")
          : [],
        preparationInstructions:
          typeof b.preparationInstructions === "string" ? b.preparationInstructions : null,
        price: b.price,
        homeCollectionEligible: Boolean(b.homeCollectionEligible),
        payAtReceptionEligible: b.payAtReceptionEligible !== false,
      },
    });
    res.status(201).json({ test: toTestDto(test) });
  }),
);

adminCatalogueRouter.patch(
  "/lab-tests/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.labTest.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Lab test not found");

    const b = req.body ?? {};
    const test = await prisma.labTest.update({
      where: { id: existing.id },
      data: {
        name: typeof b.name === "string" ? b.name.trim() : undefined,
        category: typeof b.category === "string" ? b.category.trim() : undefined,
        isPackage: typeof b.isPackage === "boolean" ? b.isPackage : undefined,
        includedParameters: Array.isArray(b.includedParameters)
          ? b.includedParameters.filter((p: unknown) => typeof p === "string")
          : undefined,
        preparationInstructions:
          b.preparationInstructions === undefined ? undefined : (b.preparationInstructions ?? null),
        price: typeof b.price === "number" ? b.price : undefined,
        homeCollectionEligible:
          typeof b.homeCollectionEligible === "boolean" ? b.homeCollectionEligible : undefined,
        payAtReceptionEligible:
          typeof b.payAtReceptionEligible === "boolean" ? b.payAtReceptionEligible : undefined,
      },
    });
    res.json({ test: toTestDto(test) });
  }),
);

adminCatalogueRouter.delete(
  "/lab-tests/:id",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const existing = await prisma.labTest.findFirst({
      where: { id: req.params.id, organizationId },
    });
    if (!existing) throw new HttpError(404, "Lab test not found");

    const lineItemCount = await prisma.bookingLineItem.count({ where: { labTestId: existing.id } });
    if (lineItemCount > 0) {
      throw new HttpError(409, "Cannot delete — this test is referenced by existing bookings");
    }
    await prisma.centreLabTest.deleteMany({ where: { labTestId: existing.id } });
    await prisma.labTest.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// Centre <-> item offerings (which centres offer a given item, and per-centre price
// overrides). Queryable/writable from either the item side or the centre side — both
// admin screens (catalogue detail, centre detail) call the same two endpoints per type.
// ---------------------------------------------------------------------------

adminCatalogueRouter.get(
  "/centre-radiology-offerings",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const centreId = typeof req.query.centreId === "string" ? req.query.centreId : undefined;
    const radiologyExamId =
      typeof req.query.radiologyExamId === "string" ? req.query.radiologyExamId : undefined;
    if (!centreId && !radiologyExamId) {
      throw new HttpError(400, "centreId or radiologyExamId is required");
    }

    if (centreId) {
      const centre = await prisma.centre.findFirst({ where: { id: centreId, organizationId } });
      if (!centre) throw new HttpError(404, "Centre not found");
      const [exams, offerings] = await Promise.all([
        prisma.radiologyExam.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
        prisma.centreRadiologyExam.findMany({ where: { centreId } }),
      ]);
      const byExamId = new Map(offerings.map((o) => [o.radiologyExamId, o]));
      res.json({
        offerings: exams.map((exam) => ({
          centreId,
          radiologyExamId: exam.id,
          radiologyExamName: exam.name,
          basePrice: Number(exam.price),
          offered: byExamId.has(exam.id),
          priceOverride: byExamId.get(exam.id)?.priceOverride
            ? Number(byExamId.get(exam.id)!.priceOverride)
            : null,
        })),
      });
      return;
    }

    const exam = await prisma.radiologyExam.findFirst({
      where: { id: radiologyExamId, organizationId },
    });
    if (!exam) throw new HttpError(404, "Radiology exam not found");
    const [centres, offerings] = await Promise.all([
      prisma.centre.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
      prisma.centreRadiologyExam.findMany({ where: { radiologyExamId: exam.id } }),
    ]);
    const byCentreId = new Map(offerings.map((o) => [o.centreId, o]));
    res.json({
      offerings: centres.map((centre) => ({
        centreId: centre.id,
        centreName: centre.name,
        radiologyExamId: exam.id,
        basePrice: Number(exam.price),
        offered: byCentreId.has(centre.id),
        priceOverride: byCentreId.get(centre.id)?.priceOverride
          ? Number(byCentreId.get(centre.id)!.priceOverride)
          : null,
      })),
    });
  }),
);

adminCatalogueRouter.put(
  "/centre-radiology-offerings",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const { centreId, radiologyExamId, offered, priceOverride } = req.body ?? {};
    if (
      typeof centreId !== "string" ||
      typeof radiologyExamId !== "string" ||
      typeof offered !== "boolean"
    ) {
      throw new HttpError(400, "centreId, radiologyExamId and offered are required");
    }
    const [centre, exam] = await Promise.all([
      prisma.centre.findFirst({ where: { id: centreId, organizationId } }),
      prisma.radiologyExam.findFirst({ where: { id: radiologyExamId, organizationId } }),
    ]);
    if (!centre || !exam) throw new HttpError(404, "Centre or radiology exam not found");

    if (!offered) {
      await prisma.centreRadiologyExam.deleteMany({ where: { centreId, radiologyExamId } });
      res.json({ centreId, radiologyExamId, offered: false, priceOverride: null });
      return;
    }
    const override =
      priceOverride === null || priceOverride === undefined ? null : Number(priceOverride);
    const row = await prisma.centreRadiologyExam.upsert({
      where: { centreId_radiologyExamId: { centreId, radiologyExamId } },
      create: { centreId, radiologyExamId, priceOverride: override },
      update: { priceOverride: override },
    });
    res.json({
      centreId: row.centreId,
      radiologyExamId: row.radiologyExamId,
      offered: true,
      priceOverride: row.priceOverride ? Number(row.priceOverride) : null,
    });
  }),
);

adminCatalogueRouter.get(
  "/centre-lab-offerings",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const centreId = typeof req.query.centreId === "string" ? req.query.centreId : undefined;
    const labTestId = typeof req.query.labTestId === "string" ? req.query.labTestId : undefined;
    if (!centreId && !labTestId) {
      throw new HttpError(400, "centreId or labTestId is required");
    }

    if (centreId) {
      const centre = await prisma.centre.findFirst({ where: { id: centreId, organizationId } });
      if (!centre) throw new HttpError(404, "Centre not found");
      const [tests, offerings] = await Promise.all([
        prisma.labTest.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
        prisma.centreLabTest.findMany({ where: { centreId } }),
      ]);
      const byTestId = new Map(offerings.map((o) => [o.labTestId, o]));
      res.json({
        offerings: tests.map((test) => ({
          centreId,
          labTestId: test.id,
          labTestName: test.name,
          basePrice: Number(test.price),
          offered: byTestId.has(test.id),
          priceOverride: byTestId.get(test.id)?.priceOverride
            ? Number(byTestId.get(test.id)!.priceOverride)
            : null,
        })),
      });
      return;
    }

    const test = await prisma.labTest.findFirst({ where: { id: labTestId, organizationId } });
    if (!test) throw new HttpError(404, "Lab test not found");
    const [centres, offerings] = await Promise.all([
      prisma.centre.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
      prisma.centreLabTest.findMany({ where: { labTestId: test.id } }),
    ]);
    const byCentreId = new Map(offerings.map((o) => [o.centreId, o]));
    res.json({
      offerings: centres.map((centre) => ({
        centreId: centre.id,
        centreName: centre.name,
        labTestId: test.id,
        basePrice: Number(test.price),
        offered: byCentreId.has(centre.id),
        priceOverride: byCentreId.get(centre.id)?.priceOverride
          ? Number(byCentreId.get(centre.id)!.priceOverride)
          : null,
      })),
    });
  }),
);

adminCatalogueRouter.put(
  "/centre-lab-offerings",
  asyncHandler(async (req, res) => {
    const organizationId = req.adminUser!.organizationId;
    const { centreId, labTestId, offered, priceOverride } = req.body ?? {};
    if (
      typeof centreId !== "string" ||
      typeof labTestId !== "string" ||
      typeof offered !== "boolean"
    ) {
      throw new HttpError(400, "centreId, labTestId and offered are required");
    }
    const [centre, test] = await Promise.all([
      prisma.centre.findFirst({ where: { id: centreId, organizationId } }),
      prisma.labTest.findFirst({ where: { id: labTestId, organizationId } }),
    ]);
    if (!centre || !test) throw new HttpError(404, "Centre or lab test not found");

    if (!offered) {
      await prisma.centreLabTest.deleteMany({ where: { centreId, labTestId } });
      res.json({ centreId, labTestId, offered: false, priceOverride: null });
      return;
    }
    const override =
      priceOverride === null || priceOverride === undefined ? null : Number(priceOverride);
    const row = await prisma.centreLabTest.upsert({
      where: { centreId_labTestId: { centreId, labTestId } },
      create: { centreId, labTestId, priceOverride: override },
      update: { priceOverride: override },
    });
    res.json({
      centreId: row.centreId,
      labTestId: row.labTestId,
      offered: true,
      priceOverride: row.priceOverride ? Number(row.priceOverride) : null,
    });
  }),
);
