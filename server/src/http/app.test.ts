import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { setProvider } from "../whatsapp/provider.js";
import { FakeProvider } from "../whatsapp/fake.js";
import { seedClient, seedDriver, seedUnit, resetDb } from "../testutils/db.js";

// Auth is stubbed in test via a header the middleware honors when NODE_ENV=test.
const app = createApp();
let clientId: string, driverId: string, unitId: string;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await resetDb(); setProvider(new FakeProvider());
  clientId = await seedClient(); driverId = await seedDriver(); unitId = await seedUnit();
});

describe("POST /api/loads concurrency", () => {
  it("two concurrent creates for the same driver → exactly one 201 and one 409", async () => {
    const body = { client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driverId };
    const [a, b] = await Promise.all([
      request(app).post("/api/loads").set("x-test-user", "u1").send(body),
      request(app).post("/api/loads").set("x-test-user", "u1").send(body),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
    const conflict = [a, b].find((r) => r.status === 409)!;
    expect(conflict.body.code).toBe("DRIVER_HAS_ACTIVE_LOAD");
  });
});
