import { describe, it, expect, beforeAll } from "vitest";
import { WhatsAppProvider, TemplateName } from "@tp/types";
import { setProvider } from "../whatsapp/provider.js";
import { FakeProvider } from "../whatsapp/fake.js";
import { createAndAssign, advance } from "./loadService.js";
import { DomainError } from "../domain/errors.js";
import { getServiceClient } from "../db/client.js";
// Test helpers seedClient/seedDriver/seedUnit insert rows via the service client
// and return ids. Implement them in a test-utils file if not present.
import { seedClient, seedDriver, seedUnit, resetDb } from "../testutils/db.js";

let fake: FakeProvider;
let clientId: string, driverId: string, unitId: string;

beforeAll(async () => {
  await resetDb();
  fake = new FakeProvider(); setProvider(fake);
  clientId = await seedClient(); driverId = await seedDriver(); unitId = await seedUnit();
});

describe("createAndAssign", () => {
  it("creates a sent load and sends the assignment template", async () => {
    const load = await createAndAssign({
      client_id: clientId, cargo_description: "Cerveza", weight_kg: 9000,
      origin: "Lima", destination: "Arequipa", scheduled_date: "2026-07-20",
      price: 3500, currency: "PEN", unit_id: unitId, driver_id: driverId,
    }, "user-1");
    expect(load.status).toBe("sent");
    expect(load.confirm_due_at).not.toBeNull();
    expect(fake.sent.at(-1)?.template).toBe("asignacion");
  });

  it("rejects a second active load for the same driver with a 409", async () => {
    await expect(createAndAssign({
      client_id: clientId, cargo_description: "Otra", weight_kg: 100,
      origin: "Lima", destination: "Cusco", scheduled_date: "2026-07-21",
      price: 1000, currency: "PEN", unit_id: unitId, driver_id: driverId,
    }, "user-1")).rejects.toMatchObject({ status: 409, code: "DRIVER_HAS_ACTIVE_LOAD" });
  });
});

describe("advance", () => {
  it("rejects an illegal advance (sent → delivered)", async () => {
    const load = await createAndAssign({
      client_id: clientId, cargo_description: "C", weight_kg: 1,
      origin: "a", destination: "b", scheduled_date: "2026-07-22", price: 1,
      currency: "PEN", unit_id: unitId, driver_id: await seedDriver(),
    }, "user-1");
    await expect(advance(load.id, { to: "delivered" }, "user-1"))
      .rejects.toBeInstanceOf(DomainError);
  });
});

class ThrowingProvider implements WhatsAppProvider {
  async send(_to: string, _template: TemplateName, _vars: string[]): Promise<{ sid: string }> {
    throw new Error("twilio caido");
  }
}

describe("createAndAssign — failed send (spec §6)", () => {
  it("does not throw, keeps status 'sent' (aspirational), and records a failed message row", async () => {
    try {
      setProvider(new ThrowingProvider());
      const freshDriverId = await seedDriver();
      const load = await createAndAssign({
        client_id: clientId, cargo_description: "Envio fallido", weight_kg: 500,
        origin: "Lima", destination: "Trujillo", scheduled_date: "2026-07-23",
        price: 800, currency: "PEN", unit_id: unitId, driver_id: freshDriverId,
      }, "user-1");

      expect(load.status).toBe("sent");

      const { data: messages, error } = await getServiceClient()
        .from("messages")
        .select("*")
        .eq("load_id", load.id)
        .eq("status", "failed");
      expect(error).toBeNull();
      expect(messages).toHaveLength(1);
      expect(messages![0].status).toBe("failed");
    } finally {
      setProvider(new FakeProvider());
    }
  });
});
