import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app, cleanupOrg, createLabTest, createRadiologyExam, createTestOrg } from "./helpers";

describe("GET /api/orgs/:orgSlug/search", () => {
  let orgSlug: string;
  let orgId: string;

  beforeAll(async () => {
    const org = await createTestOrg("search");
    orgSlug = org.slug;
    orgId = org.id;
    await createRadiologyExam(orgId, { name: "USG Abdomen" });
    await createLabTest(orgId, { name: "USG Follow-up Panel" });
  });

  afterAll(async () => {
    await cleanupOrg(orgId);
  });

  it("rejects a query under the 3-character minimum", async () => {
    const res = await request(app).get(`/api/orgs/${orgSlug}/search`).query({ q: "us" });
    expect(res.status).toBe(400);
  });

  it("rejects a missing query", async () => {
    const res = await request(app).get(`/api/orgs/${orgSlug}/search`);
    expect(res.status).toBe(400);
  });

  it("returns radiology and lab results tagged by type for a valid query", async () => {
    const res = await request(app).get(`/api/orgs/${orgSlug}/search`).query({ q: "USG" });
    expect(res.status).toBe(200);

    const types = res.body.results.map((r: { type: string }) => r.type);
    expect(types).toContain("SCAN");
    expect(types).toContain("TEST");
  });

  it("returns 404 for an unknown organization", async () => {
    const res = await request(app).get("/api/orgs/no-such-org/search").query({ q: "USG" });
    expect(res.status).toBe(404);
  });
});
