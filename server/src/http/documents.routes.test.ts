import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { getServiceClient } from "../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../testutils/db.js";
import { guiaWithQr } from "../testutils/guia.js";

const CLIENT_RUC = "20100047218";
const app = createApp();
let loadId: string;

beforeAll(async () => {
  await resetDb();
  const clientId = await seedClient();
  const driverId = await seedDriver();
  const unitId = await seedUnit();
  const { data } = await getServiceClient().from("loads").insert({
    client_id: clientId, cargo_description: "Cerveza", weight_kg: 9000,
    origin: "Lima", destination: "Arequipa", scheduled_date: "2026-07-18",
    price: 3500, currency: "PEN", status: "en_route",
    assigned_unit_id: unitId, assigned_driver_id: driverId,
  }).select().single();
  loadId = data!.id as string;
}, 30_000);

describe("documents routes", () => {
  it("uploads a guía, lists it, and confirms it", async () => {
    const payload = `${CLIENT_RUC}|09|T001|80|2026-07-18|20131312955`;
    const buf = await guiaWithQr(payload);
    const up = await request(app)
      .post(`/api/loads/${loadId}/documents`)
      .attach("file", buf, "guia.png");
    expect(up.status).toBe(201);
    expect(up.body.outcome).toBe("created");
    const docId = up.body.document.id;

    const list = await request(app).get("/api/documents?status=pending");
    expect(list.status).toBe(200);
    expect(list.body.some((d: { id: string }) => d.id === docId)).toBe(true);

    const confirm = await request(app).post(`/api/documents/${docId}/confirm`).send({ peso_kg: 8900 });
    expect(confirm.status).toBe(200);
    expect(confirm.body.loadStatusChanged).toBe(true);
  });
});
