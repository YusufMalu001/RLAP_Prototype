// TODO(production): this is a mock. Replace with real Google Cloud Vision text extraction
// (§6.1) plus a real line-item matcher against the org's catalogue before this ships —
// today's "matches" are just a deterministic-per-filename sample of the org's own catalogue,
// not anything read from the uploaded image.
import { prisma } from "@rlap/db";

export type OcrConfidence = "HIGH" | "LOW";

export interface OcrMatchedLine {
  rawText: string;
  confidence: OcrConfidence;
  matchedItemType: "RADIOLOGY_EXAM" | "LAB_TEST";
  matchedItemId: string;
  matchedItemName: string;
}

export interface OcrUnmatchedLine {
  rawText: string;
}

export interface OcrExtractionResult {
  matched: OcrMatchedLine[];
  unmatched: OcrUnmatchedLine[];
}

export interface OcrExtractRequest {
  organizationId: string;
  filename: string;
}

export interface OcrProvider {
  extract(request: OcrExtractRequest): Promise<OcrExtractionResult>;
}

const UNMATCHED_LINE_POOL = [
  "Tab. [illegible] 1-0-1 x 5 days",
  "adv. [illegible] profile",
  "[illegible handwriting]",
  "f/u after 2 weeks",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

// Deterministic PRNG (mulberry32) seeded from the filename so the same upload always
// produces the same mock result — useful for demos and for writing repeatable tests.
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deliberate test hook (mirrors payment.ts's ".13 fails" trick): a filename containing any of
// these words always simulates total OCR failure, so the O4 fallback screen is reachable
// on demand without needing an org with an empty catalogue.
const FORCED_TOTAL_FAILURE_PATTERN = /fail|blurry|unreadable/i;

class MockOcrProvider implements OcrProvider {
  async extract({ organizationId, filename }: OcrExtractRequest): Promise<OcrExtractionResult> {
    const rng = mulberry32(hashString(filename));

    if (FORCED_TOTAL_FAILURE_PATTERN.test(filename)) {
      return { matched: [], unmatched: [] };
    }

    const [exams, tests] = await Promise.all([
      prisma.radiologyExam.findMany({
        where: { organizationId },
        take: 10,
        orderBy: { name: "asc" },
      }),
      prisma.labTest.findMany({ where: { organizationId }, take: 10, orderBy: { name: "asc" } }),
    ]);

    const catalogue = [
      ...exams.map((exam) => ({
        itemType: "RADIOLOGY_EXAM" as const,
        id: exam.id,
        name: exam.name,
      })),
      ...tests.map((test) => ({ itemType: "LAB_TEST" as const, id: test.id, name: test.name })),
    ];

    const unmatched: OcrUnmatchedLine[] = [
      { rawText: UNMATCHED_LINE_POOL[Math.floor(rng() * UNMATCHED_LINE_POOL.length)]! },
    ];

    if (catalogue.length === 0) {
      return { matched: [], unmatched };
    }

    // Deterministic shuffle, then take 2-4 lines (or fewer if the catalogue is small).
    const shuffled = catalogue
      .map((item) => ({ item, sortKey: rng() }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ item }) => item);
    const matchedCount = Math.min(shuffled.length, 2 + Math.floor(rng() * 3));

    const matched: OcrMatchedLine[] = shuffled.slice(0, matchedCount).map((item) => ({
      rawText: item.name,
      // Roughly two-thirds HIGH confidence, one-third LOW — enough of each for the frontend
      // to build the "tagged / amber-outlined / plain unmatched" three-state cart UI against.
      confidence: rng() < 0.66 ? "HIGH" : "LOW",
      matchedItemType: item.itemType,
      matchedItemId: item.id,
      matchedItemName: item.name,
    }));

    return { matched, unmatched };
  }
}

export const ocrProvider: OcrProvider = new MockOcrProvider();
