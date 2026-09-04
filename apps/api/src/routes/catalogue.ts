import { Router } from "express";
import { prisma } from "@rlap/db";
import type { BodyPartCategory, LabTest, Modality, RadiologyExam } from "@rlap/db";
import { withOrg } from "../lib/withOrg";

// Canonical ordering matches the widget's own tile order (§4.2, screens R1/R2).
const MODALITY_ORDER: Modality[] = ["ULTRASOUND", "XRAY", "CT", "MRI", "ECG"];
const MODALITY_VALUES = new Set<string>(MODALITY_ORDER);

const BODY_PART_CATEGORY_ORDER: BodyPartCategory[] = [
  "HEAD_NECK",
  "CHEST_CARDIAC",
  "ABDOMEN_PELVIS",
  "SPINE",
  "UPPER_LIMB",
  "LOWER_LIMB",
  "WHOLE_BODY",
];
const BODY_PART_CATEGORY_VALUES = new Set<string>(BODY_PART_CATEGORY_ORDER);

// §4.2 SC1: "Minimum 3 characters required to trigger results."
const MIN_SEARCH_LENGTH = 3;

export const catalogueRouter = Router();

function toExamSummary(exam: RadiologyExam) {
  return {
    id: exam.id,
    name: exam.name,
    modality: exam.modality,
    bodyPartCategory: exam.bodyPartCategory,
    requiresSafetyCheck: exam.requiresSafetyCheck,
    price: Number(exam.price),
  };
}

function toLabTestSummary(test: LabTest) {
  return {
    id: test.id,
    name: test.name,
    category: test.category,
    isPackage: test.isPackage,
    price: Number(test.price),
    homeCollectionEligible: test.homeCollectionEligible,
  };
}

function toLabTestDetail(test: LabTest) {
  return {
    ...toLabTestSummary(test),
    includedParameters: test.includedParameters,
    preparationInstructions: test.preparationInstructions,
  };
}

catalogueRouter.get(
  "/orgs/:orgSlug/search",
  withOrg(async (req, res, org) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < MIN_SEARCH_LENGTH) {
      res
        .status(400)
        .json({ error: `Search query must be at least ${MIN_SEARCH_LENGTH} characters.` });
      return;
    }

    const [exams, tests] = await Promise.all([
      prisma.radiologyExam.findMany({
        where: { organizationId: org.id, name: { contains: q, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 20,
      }),
      prisma.labTest.findMany({
        where: { organizationId: org.id, name: { contains: q, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 20,
      }),
    ]);

    const results = [
      ...exams.map((exam) => ({ type: "SCAN" as const, ...toExamSummary(exam) })),
      ...tests.map((test) => ({ type: "TEST" as const, ...toLabTestSummary(test) })),
    ];

    res.json({ query: q, results });
  }),
);

catalogueRouter.get(
  "/orgs/:orgSlug/radiology/modalities",
  withOrg(async (_req, res, org) => {
    const rows = await prisma.radiologyExam.findMany({
      where: { organizationId: org.id },
      distinct: ["modality"],
      select: { modality: true },
    });
    const present = new Set(rows.map((row) => row.modality));
    res.json({ modalities: MODALITY_ORDER.filter((modality) => present.has(modality)) });
  }),
);

catalogueRouter.get(
  "/orgs/:orgSlug/radiology/modalities/:modality/categories",
  withOrg(async (req, res, org) => {
    const modality = req.params.modality!.toUpperCase();
    if (!MODALITY_VALUES.has(modality)) {
      res.status(400).json({ error: `Invalid modality "${req.params.modality}".` });
      return;
    }

    const rows = await prisma.radiologyExam.findMany({
      where: { organizationId: org.id, modality: modality as Modality },
      distinct: ["bodyPartCategory"],
      select: { bodyPartCategory: true },
    });
    const present = new Set(rows.map((row) => row.bodyPartCategory));
    res.json({
      modality,
      categories: BODY_PART_CATEGORY_ORDER.filter((category) => present.has(category)),
    });
  }),
);

catalogueRouter.get(
  "/orgs/:orgSlug/radiology/exams",
  withOrg(async (req, res, org) => {
    const modalityParam =
      typeof req.query.modality === "string" ? req.query.modality.toUpperCase() : undefined;
    const categoryParam =
      typeof req.query.category === "string" ? req.query.category.toUpperCase() : undefined;

    if (modalityParam && !MODALITY_VALUES.has(modalityParam)) {
      res.status(400).json({ error: `Invalid modality "${req.query.modality}".` });
      return;
    }
    if (categoryParam && !BODY_PART_CATEGORY_VALUES.has(categoryParam)) {
      res.status(400).json({ error: `Invalid category "${req.query.category}".` });
      return;
    }

    const exams = await prisma.radiologyExam.findMany({
      where: {
        organizationId: org.id,
        ...(modalityParam ? { modality: modalityParam as Modality } : {}),
        ...(categoryParam ? { bodyPartCategory: categoryParam as BodyPartCategory } : {}),
      },
      orderBy: { name: "asc" },
    });

    res.json({ exams: exams.map(toExamSummary) });
  }),
);

catalogueRouter.get(
  "/orgs/:orgSlug/lab/categories",
  withOrg(async (_req, res, org) => {
    const [categoryRows, packages] = await Promise.all([
      prisma.labTest.findMany({
        where: { organizationId: org.id, isPackage: false },
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
      prisma.labTest.findMany({
        where: { organizationId: org.id, isPackage: true },
        orderBy: { name: "asc" },
      }),
    ]);

    res.json({
      categories: categoryRows.map((row) => row.category),
      packages: packages.map(toLabTestSummary),
    });
  }),
);

catalogueRouter.get(
  "/orgs/:orgSlug/lab/tests",
  withOrg(async (req, res, org) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const tests = await prisma.labTest.findMany({
      where: { organizationId: org.id, ...(category ? { category } : {}) },
      orderBy: { name: "asc" },
    });
    res.json({ tests: tests.map(toLabTestSummary) });
  }),
);

catalogueRouter.get(
  "/orgs/:orgSlug/lab/tests/:id",
  withOrg(async (req, res, org) => {
    const test = await prisma.labTest.findFirst({
      where: { id: req.params.id, organizationId: org.id },
    });
    if (!test) {
      res.status(404).json({ error: "Lab test not found" });
      return;
    }
    res.json({ test: toLabTestDetail(test) });
  }),
);
