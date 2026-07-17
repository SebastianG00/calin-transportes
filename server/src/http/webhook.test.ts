import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { setProvider } from "../whatsapp/provider.js";
import { FakeProvider } from "../whatsapp/fake.js";
import { getServiceClient } from "../db/client.js";
import { createAndAssign } from "../services/loadService.js";
import { seedClient, seedUnit, resetDb } from "../testutils/db.js";

const app = createApp();
beforeEach(async () => { process.env.NODE_ENV = "test"; await resetDb(); setProvider(new FakeProvider()); });

describe("POST /webhook/whatsapp", () => {
  it("processes a '1' reply and returns 200 with a Spanish confirmation", async () => {
    const clientId = await seedClient(); const unitId = await seedUnit();
    const { data: driver } = await getServiceClient().from("drivers")
      .insert({ name: "Juan", whatsapp_phone: "+51987650000", active: true }).select().single();
    await createAndAssign({ client_id: clientId, cargo_description: "C", weight_kg: 1, origin: "a", destination: "b", scheduled_date: "2026-07-20", price: 1, currency: "PEN", unit_id: unitId, driver_id: driver!.id }, "u");
    const res = await request(app).post("/webhook/whatsapp")
      .type("form").send({ MessageSid: "SM1", From: "whatsapp:+51987650000", Body: "1" });
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/confirmada/i);
  });
});
