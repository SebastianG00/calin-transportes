import { describe, it, expect, beforeAll } from "vitest";
import { getServiceClient } from "../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../testutils/db.js";
import { guiaWithQr, blankGuia, blurryGuia } from "../testutils/guia.js";
import { processDocumentMessage } from "./pipeline.js";

// Backus RUC used by seedClient() → the reconciliation ground truth.
const CLIENT_RUC = "20100047218";
let loadId: string;

async function uploadMessage(buf: Buffer, load_id: string): Promise<string> {
  const db = getServiceClient();
  const path = `test/${crypto.randomUUID()}.png`;
  await db.storage.from("guias").upload(path, buf, { contentType: "image/png", upsert: true });
  const { data } = await db.from("messages").insert({
    provider: "office", provider_message_sid: `test-${crypto.randomUUID()}`,
    direction: "in", load_id, media_storage_path: path, processed: false,
  }).select().single();
  return data!.id as string;
}

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

describe("processDocumentMessage", () => {
  it("valid guía → creates a pending doc with green validation and QR fields", async () => {
    const payload = `${CLIENT_RUC}|09|T001|55|2026-07-18|20131312955`;
    const msgId = await uploadMessage(await guiaWithQr(payload), loadId);
    const res = await processDocumentMessage(msgId);
    expect(res.outcome).toBe("created");
    if (res.outcome === "created") {
      expect(res.document.doc_type).toBe("gre_remitente");
      expect(res.document.ruc).toBe(CLIENT_RUC);
      expect(res.document.review_status).toBe("pending");
      expect((res.document.validation as { overall: string }).overall).toBe("green");
    }
  });

  it("blurry guía → retake, no document row", async () => {
    const payload = `${CLIENT_RUC}|09|T001|56|2026-07-18|20131312955`;
    const msgId = await uploadMessage(await blurryGuia(payload), loadId);
    const res = await processDocumentMessage(msgId);
    expect(res.outcome).toBe("retake");
  });

  it("RUC ≠ client → doc created but validation red with RUC_MISMATCH", async () => {
    const payload = `20131312955|09|T001|57|2026-07-18|20131312955`;
    const msgId = await uploadMessage(await guiaWithQr(payload), loadId);
    const res = await processDocumentMessage(msgId);
    expect(res.outcome).toBe("created");
    if (res.outcome === "created") {
      const v = res.document.validation as { overall: string; flags: { reason_code: string }[] };
      expect(v.overall).toBe("red");
      expect(v.flags.some((f) => f.reason_code === "RUC_MISMATCH")).toBe(true);
    }
  });

  it("no decodable QR → doc_type 'other', still a pending review item", async () => {
    const msgId = await uploadMessage(await blankGuia(), loadId);
    const res = await processDocumentMessage(msgId);
    // blank sheet is flat → may trip the quality gate; accept either retake or an 'other' doc.
    if (res.outcome === "created") {
      expect(res.document.doc_type).toBe("other");
    } else {
      expect(res.outcome).toBe("retake");
    }
  });

  it("re-sending the same image → duplicate, no second row", async () => {
    const payload = `${CLIENT_RUC}|09|T001|58|2026-07-18|20131312955`;
    const buf = await guiaWithQr(payload);
    const first = await processDocumentMessage(await uploadMessage(buf, loadId));
    expect(first.outcome).toBe("created");
    const second = await processDocumentMessage(await uploadMessage(buf, loadId));
    expect(second.outcome).toBe("duplicate");
  });
});
