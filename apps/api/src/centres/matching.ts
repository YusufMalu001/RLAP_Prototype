import { prisma } from "@rlap/db";
import type { Centre, Prisma } from "@rlap/db";

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

/**
 * The critical centre-matching rule (§2.3, §4.2 R6/L5b/C2): a centre only qualifies if it
 * offers EVERY radiology exam AND EVERY lab test currently requested — at the same centre,
 * not just "offers radiology" and "offers lab" as separate facts. An empty (radiologyExamIds,
 * labTestIds) pair returns [] rather than matching every centre — "every item in an empty set
 * is satisfied" is vacuously true and would otherwise wrongly return the whole catalogue.
 */
export async function findMatchingCentres(
  organizationId: string,
  radiologyExamIds: string[],
  labTestIds: string[],
): Promise<Centre[]> {
  const uniqueRadiologyIds = [...new Set(radiologyExamIds)];
  const uniqueLabIds = [...new Set(labTestIds)];

  if (uniqueRadiologyIds.length === 0 && uniqueLabIds.length === 0) {
    return [];
  }

  const centreWhere: Prisma.CentreWhereInput = { organizationId };
  if (uniqueRadiologyIds.length > 0) centreWhere.offersRadiology = true;
  if (uniqueLabIds.length > 0) centreWhere.offersLab = true;

  const candidateCentres = await prisma.centre.findMany({
    where: centreWhere,
    orderBy: { name: "asc" },
  });
  if (candidateCentres.length === 0) return [];

  const candidateIds = candidateCentres.map((centre) => centre.id);

  const [radiologyCounts, labCounts] = await Promise.all([
    uniqueRadiologyIds.length > 0
      ? prisma.centreRadiologyExam.groupBy({
          by: ["centreId"],
          where: { centreId: { in: candidateIds }, radiologyExamId: { in: uniqueRadiologyIds } },
          _count: { radiologyExamId: true },
        })
      : Promise.resolve([]),
    uniqueLabIds.length > 0
      ? prisma.centreLabTest.groupBy({
          by: ["centreId"],
          where: { centreId: { in: candidateIds }, labTestId: { in: uniqueLabIds } },
          _count: { labTestId: true },
        })
      : Promise.resolve([]),
  ]);

  const radiologyFullMatch = new Set(
    radiologyCounts
      .filter((row) => row._count.radiologyExamId === uniqueRadiologyIds.length)
      .map((row) => row.centreId),
  );
  const labFullMatch = new Set(
    labCounts
      .filter((row) => row._count.labTestId === uniqueLabIds.length)
      .map((row) => row.centreId),
  );

  return candidateCentres.filter((centre) => {
    const radiologyOk = uniqueRadiologyIds.length === 0 || radiologyFullMatch.has(centre.id);
    const labOk = uniqueLabIds.length === 0 || labFullMatch.has(centre.id);
    return radiologyOk && labOk;
  });
}
