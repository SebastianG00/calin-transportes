import { describe, it, expect, beforeAll } from "vitest";
import { getServiceClient } from "../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../testutils/db.js";
import { guiaWithQr } from "../testutils/guia.js";
import { uploadGuia, confirmDocument, getDocumentDetail } from "./documentService.js";

const CLIENT_RUC = "20100047218";
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

describe("uploadGuia → confirmDocument", () => {
  it("uploads a valid guía and confirming flips the en_route load to delivered", async () => {
    const payload = `${CLIENT_RUC}|09|T001|70|2026-07-18|20131312955`;
    const res = await uploadGuia(loadId, await guiaWithQr(payload), "image/png");
    expect(res.outcome).toBe("created");
    const docId = res.outcome === "created" ? (res.document.id as string) : "";

    const detail = await getDocumentDetail(docId);
    expect(detail.photoUrl).toBeTruthy();

    // Non-UUID actor (as the test-auth path injects): confirmed_by FKs to
    // auth.users, so a UUID-shaped-but-nonexistent id would violate the FK.
    // Per the Slice-1 created_by convention, non-UUID actors persist as null.
    const out = await confirmDocument(docId, { peso_kg: 8900 }, "test-user");
    expect(out.loadStatusChanged).toBe(true);
    const { data: load } = await getServiceClient().from("loads").select("status").eq("id", loadId).single();
    expect(load!.status).toBe("delivered");

    // A correction was logged for peso.
    const { data: events } = await getServiceClient()
      .from("document_events").select("*").eq("document_id", docId).eq("kind", "correction");
    expect((events ?? []).length).toBeGreaterThan(0);
  });
});
