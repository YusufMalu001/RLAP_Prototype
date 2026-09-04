import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findMatchingCentres } from "../centres/matching";
import {
  cleanupOrg,
  createCentre,
  createLabTest,
  createRadiologyExam,
  createTestOrg,
  linkCentreLabTest,
  linkCentreRadiologyExam,
} from "./helpers";

describe("findMatchingCentres", () => {
  let orgAId: string;
  let orgBId: string;

  let examMri: string;
  let examCt: string;
  let testLipid: string;
  let testCbc: string;

  // A centre offering everything — the exact-match candidate for combined queries.
  let centreBoth: string;
  // Offers both radiology exams but no lab tests at all.
  let centreRadiologyOnly: string;
  // Offers both lab tests but no radiology exams at all.
  let centreLabOnly: string;
  // Offers all radiology items but only ONE of the two lab items — the partial-match trap.
  let centrePartialLab: string;

  // A second exam/test pair, each offered at exactly one centre and never together —
  // guarantees a genuine zero-match combined query independent of centreBoth.
  let examOnlyAtRadiologyOnly: string;
  let testOnlyAtLabOnly: string;

  // Org B: a structurally identical catalogue in a different tenant, for isolation checks.
  let orgBExam: string;
  let orgBCentre: string;

  beforeAll(async () => {
    const orgA = await createTestOrg("match-a");
    const orgB = await createTestOrg("match-b");
    orgAId = orgA.id;
    orgBId = orgB.id;

    examMri = (await createRadiologyExam(orgAId, { name: "MRI Brain Plain" })).id;
    examCt = (
      await createRadiologyExam(orgAId, { name: "CT Chest Plain", requiresSafetyCheck: false })
    ).id;
    testLipid = (await createLabTest(orgAId, { name: "Lipid Profile" })).id;
    testCbc = (await createLabTest(orgAId, { name: "CBC" })).id;
    examOnlyAtRadiologyOnly = (
      await createRadiologyExam(orgAId, { name: "X-Ray Spine Lumbar", requiresSafetyCheck: false })
    ).id;
    testOnlyAtLabOnly = (await createLabTest(orgAId, { name: "Thyroid Profile" })).id;

    centreBoth = (
      await createCentre(orgAId, { name: "Centre Both", offersRadiology: true, offersLab: true })
    ).id;
    centreRadiologyOnly = (
      await createCentre(orgAId, {
        name: "Centre Radiology Only",
        offersRadiology: true,
        offersLab: false,
      })
    ).id;
    centreLabOnly = (
      await createCentre(orgAId, {
        name: "Centre Lab Only",
        offersRadiology: false,
        offersLab: true,
      })
    ).id;
    centrePartialLab = (
      await createCentre(orgAId, {
        name: "Centre Partial Lab",
        offersRadiology: true,
        offersLab: true,
      })
    ).id;

    await linkCentreRadiologyExam(centreBoth, examMri);
    await linkCentreRadiologyExam(centreBoth, examCt);
    await linkCentreLabTest(centreBoth, testLipid);
    await linkCentreLabTest(centreBoth, testCbc);

    await linkCentreRadiologyExam(centreRadiologyOnly, examMri);
    await linkCentreRadiologyExam(centreRadiologyOnly, examCt);
    await linkCentreRadiologyExam(centreRadiologyOnly, examOnlyAtRadiologyOnly);

    await linkCentreLabTest(centreLabOnly, testLipid);
    await linkCentreLabTest(centreLabOnly, testCbc);
    await linkCentreLabTest(centreLabOnly, testOnlyAtLabOnly);

    await linkCentreRadiologyExam(centrePartialLab, examMri);
    await linkCentreRadiologyExam(centrePartialLab, examCt);
    await linkCentreLabTest(centrePartialLab, testLipid); // deliberately missing testCbc

    orgBExam = (await createRadiologyExam(orgBId, { name: "MRI Brain Plain" })).id;
    orgBCentre = (
      await createCentre(orgBId, { name: "Org B Centre", offersRadiology: true, offersLab: true })
    ).id;
    await linkCentreRadiologyExam(orgBCentre, orgBExam);
  });

  afterAll(async () => {
    await cleanupOrg(orgAId);
    await cleanupOrg(orgBId);
  });

  it("exact match: a centre offering every requested radiology AND lab item is returned", async () => {
    const result = await findMatchingCentres(orgAId, [examMri, examCt], [testLipid, testCbc]);
    expect(result.map((c) => c.id)).toEqual([centreBoth]);
  });

  it("partial match: a centre missing even one requested lab item is excluded from a combined query", async () => {
    const result = await findMatchingCentres(orgAId, [examMri, examCt], [testLipid, testCbc]);
    const ids = result.map((c) => c.id);
    expect(ids).not.toContain(centrePartialLab);
    expect(ids).not.toContain(centreRadiologyOnly);
    expect(ids).not.toContain(centreLabOnly);
  });

  it("returns zero centres when the requested items are never offered together at one centre", async () => {
    const result = await findMatchingCentres(
      orgAId,
      [examOnlyAtRadiologyOnly],
      [testOnlyAtLabOnly],
    );
    expect(result).toEqual([]);
  });

  it("returns [] for an empty cart instead of vacuously matching every centre", async () => {
    const result = await findMatchingCentres(orgAId, [], []);
    expect(result).toEqual([]);
  });

  it("radiology-only query ignores lab coverage entirely", async () => {
    const result = await findMatchingCentres(orgAId, [examMri, examCt], []);
    const ids = result.map((c) => c.id);
    expect(ids).toContain(centreBoth);
    expect(ids).toContain(centreRadiologyOnly);
    expect(ids).toContain(centrePartialLab);
    expect(ids).not.toContain(centreLabOnly);
  });

  it("lab-only query ignores radiology coverage entirely", async () => {
    const result = await findMatchingCentres(orgAId, [], [testLipid, testCbc]);
    const ids = result.map((c) => c.id);
    expect(ids).toContain(centreBoth);
    expect(ids).toContain(centreLabOnly);
    expect(ids).not.toContain(centreRadiologyOnly);
    expect(ids).not.toContain(centrePartialLab);
  });

  it("org isolation: never returns another organization's centres", async () => {
    const result = await findMatchingCentres(orgAId, [examMri], []);
    expect(result.map((c) => c.id)).not.toContain(orgBCentre);
  });

  it("org isolation: a cross-org item id never spuriously matches", async () => {
    const result = await findMatchingCentres(orgAId, [orgBExam], []);
    expect(result).toEqual([]);
  });
});
