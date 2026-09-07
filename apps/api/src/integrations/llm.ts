/**
 * Lab-test recommendation transport. Given the radiology exams already in a cart and the
 * organization's actual bookable lab-test catalogue, return a short, clinically-grounded list of
 * complementary tests — e.g. a contrast CT correlates with a kidney function test (contrast
 * nephropathy risk), a cardiac workup correlates with a lipid profile, a DVT study correlates
 * with a coagulation profile. The provider is only ever allowed to pick from the given
 * candidate list by id — it never invents a test that isn't actually in the catalogue, so a
 * suggestion is always immediately bookable.
 */
export interface LabTestCandidate {
  id: string;
  name: string;
  category: string;
}

export interface LabTestSuggestion {
  id: string;
  rationale: string;
}

export interface LlmProvider {
  suggestLabTests(
    radiologyExamNames: string[],
    candidates: LabTestCandidate[],
  ): Promise<LabTestSuggestion[]>;
}

const MAX_SUGGESTIONS = 4;

function buildPrompt(radiologyExamNames: string[], candidates: LabTestCandidate[]): string {
  return `You are a clinical decision-support assistant for a diagnostics centre. A patient has booked these radiology/imaging exams:
${radiologyExamNames.map((n) => `- ${n}`).join("\n")}

From the lab test catalogue below (id | name | category), pick up to ${MAX_SUGGESTIONS} tests that are clinically complementary to the exams above — tests a radiologist or referring physician would commonly order alongside them (e.g. a contrast-enhanced scan pairs with a kidney function test for contrast-nephropathy risk; a cardiac study pairs with a lipid profile; a DVT/venous study pairs with a coagulation profile; a diabetes-related or metabolic scan pairs with HbA1c). Only ever pick ids that appear in this catalogue — never invent a test.

Catalogue:
${candidates.map((c) => `${c.id} | ${c.name} | ${c.category}`).join("\n")}

Respond with ONLY a JSON array, no prose, no markdown fences. Each element: {"id": "<catalogue id>", "rationale": "<one short clinical sentence, patient-friendly, under 20 words>"}. Return an empty array if nothing is clinically relevant.`;
}

function parseSuggestions(raw: string, validIds: Set<string>): LabTestSuggestion[] {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1]! : raw;
  const start = jsonText.indexOf("[");
  const end = jsonText.lastIndexOf("]");
  if (start === -1 || end === -1) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const suggestions: LabTestSuggestion[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const id = (entry as Record<string, unknown>).id;
    const rationale = (entry as Record<string, unknown>).rationale;
    if (typeof id !== "string" || !validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    suggestions.push({
      id,
      rationale: typeof rationale === "string" && rationale.trim() ? rationale.trim() : "Commonly ordered alongside this imaging study.",
    });
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }
  return suggestions;
}

/** Google Gemini's free API tier (generous per-minute/per-day quota, no billing required) —
 * https://ai.google.dev. Swap for any other provider by implementing LlmProvider. */
class GeminiLlmProvider implements LlmProvider {
  constructor(private readonly apiKey: string) {}

  async suggestLabTests(
    radiologyExamNames: string[],
    candidates: LabTestCandidate[],
  ): Promise<LabTestSuggestion[]> {
    if (candidates.length === 0) return [];
    const validIds = new Set(candidates.map((c) => c.id));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(radiologyExamNames, candidates) }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      },
    );

    if (!res.ok) {
      console.error(`[gemini] request failed: ${res.status} ${await res.text()}`);
      return new RuleBasedLlmProvider().suggestLabTests(radiologyExamNames, candidates);
    }

    const body = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text: string = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const suggestions = parseSuggestions(text, validIds);
    // A malformed/empty model response still deserves a useful fallback rather than nothing.
    return suggestions.length > 0
      ? suggestions
      : new RuleBasedLlmProvider().suggestLabTests(radiologyExamNames, candidates);
  }
}

/** Deterministic clinical-correlation fallback for local dev (no API key required) — a small,
 * genuinely medically-motivated keyword table, not a placeholder. Used automatically whenever
 * GEMINI_API_KEY isn't set, and as a safety net if the live model call fails or returns nothing
 * usable. */
class RuleBasedLlmProvider implements LlmProvider {
  private static readonly RULES: Array<{
    examKeywords: string[];
    testKeywords: string[];
    rationale: string;
  }> = [
    {
      examKeywords: ["contrast"],
      testKeywords: ["kidney", "kft", "creatinine", "renal"],
      rationale: "Contrast agents are renally cleared — kidney function is checked beforehand.",
    },
    {
      examKeywords: ["cardiac", "echo", "ecg", "tmt", "stress test"],
      testKeywords: ["lipid"],
      rationale: "Cardiac imaging is commonly paired with a lipid profile for risk assessment.",
    },
    {
      examKeywords: ["cardiac", "echo", "ecg"],
      testKeywords: ["hba1c", "blood sugar"],
      rationale: "Glycaemic status is a key cardiovascular risk factor alongside cardiac imaging.",
    },
    {
      examKeywords: ["doppler", "dvt", "venous"],
      testKeywords: ["coagulation", "pt/inr", "d-dimer"],
      rationale: "A clotting-risk study is standard alongside a venous/DVT ultrasound.",
    },
    {
      examKeywords: ["abdomen", "pelvis", "kub"],
      testKeywords: ["lft", "liver function", "kft", "kidney"],
      rationale: "Abdominal imaging findings are typically read alongside liver/kidney panels.",
    },
    {
      examKeywords: ["thyroid", "neck"],
      testKeywords: ["thyroid", "tsh"],
      rationale: "A thyroid ultrasound is usually paired with thyroid hormone levels.",
    },
    {
      examKeywords: ["spine", "joint", "knee", "shoulder", "bone"],
      testKeywords: ["vitamin d", "calcium"],
      rationale: "Bone/joint imaging is commonly paired with vitamin D and calcium levels.",
    },
    {
      examKeywords: ["whole body", "staging", "pns"],
      testKeywords: ["cbc", "esr", "crp"],
      rationale: "Broader imaging workups are typically paired with baseline blood counts.",
    },
    {
      examKeywords: ["mri brain", "ct brain", "ct angiography"],
      testKeywords: ["lipid", "hba1c"],
      rationale: "Cerebrovascular imaging correlates with metabolic and lipid risk factors.",
    },
  ];

  async suggestLabTests(
    radiologyExamNames: string[],
    candidates: LabTestCandidate[],
  ): Promise<LabTestSuggestion[]> {
    const examText = radiologyExamNames.join(" | ").toLowerCase();
    const suggestions: LabTestSuggestion[] = [];
    const used = new Set<string>();

    for (const rule of RuleBasedLlmProvider.RULES) {
      if (!rule.examKeywords.some((kw) => examText.includes(kw))) continue;
      for (const candidate of candidates) {
        if (used.has(candidate.id)) continue;
        const nameLower = candidate.name.toLowerCase();
        if (!rule.testKeywords.some((kw) => nameLower.includes(kw))) continue;
        used.add(candidate.id);
        suggestions.push({ id: candidate.id, rationale: rule.rationale });
        if (suggestions.length >= MAX_SUGGESTIONS) return suggestions;
        break;
      }
    }
    return suggestions;
  }
}

export const llmProvider: LlmProvider = process.env.GEMINI_API_KEY
  ? new GeminiLlmProvider(process.env.GEMINI_API_KEY)
  : new RuleBasedLlmProvider();
