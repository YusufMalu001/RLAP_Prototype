import type { PatientSession } from "./types";

// Same in-memory, restart-doesn't-survive tradeoff as the cart store — see apps/api/src/cart/store.ts.
const sessions = new Map<string, PatientSession>();

export const patientSessionStore = {
  get(token: string): PatientSession | undefined {
    return sessions.get(token);
  },
  set(session: PatientSession): void {
    sessions.set(session.token, session);
  },
};
