import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI + OCR so the test is deterministic and fast (no live call, no real OCR).
vi.mock("../ai/guiaVision.js", async (orig) => ({
  ...(await orig<typeof import("../ai/guiaVision.js")>()),
  extractGuia: vi.fn(async () => ({
    receptor: { value: "Juan Perez", verbatim: "Juan Perez" },
    ruc_receptor: { value: "20100047218", verbatim: "20100047218" },
    fecha_entrega: { value: "2026-08-01", verbatim: "01/08/2026" },
    peso: { value: "8900", verbatim: "8,900 kg" },
    bultos: { value: "120", verbatim: "120" },
    destino: { value: "Arequipa", verbatim: "Arequipa" },
    conductor: { value: "Luis Gomez", verbatim: "Luis Gomez" },
    placa: { value: "ABC-1", verbatim: "ABC-1" },
    guia_serie: { value: "T001", verbatim: "T001" },
    guia_numero: { value: "456", verbatim: "000456" },
    observaciones: { value: "conforme", verbatim: "conforme" },
    firma_presente: true, sello_presente: false,
  })),
}));
vi.mock("../pipeline/ocr.js", () => ({
  ocrWordBoxes: vi.fn(async () => [{ text: "8,900", bbox: [10, 10, 30, 12] as [number,number,number,number] }]),
  groundFields: vi.fn(() => ({ peso: [10, 10, 30, 12] as [number,number,number,number] })),
}));

import { getServiceClient } from "../db/client.js";
import { resetDb, seedClient, seedDriver, seedUnit } from "../testutils/db.js";
import { extractDocument } from "./reviewVisionService.js";

describe("reviewVisionService.extractDocument", () => {
  beforeEach(async () => { await resetDb(); });

  it("runs VLM+OCR, fills extracted with source vlm + boxes, reconciles, logs event", async () => {
    const db = getServiceClient();
    const clientId = await seedClient();
    const driverId = await seedDriver();
    const unitId = await seedUnit();
    const { data: load } = await db.from("loads").insert({
      client_id: clientId, cargo_description: "Lápices", weight_kg: 8900, origin: "Lima",
      destination: "Arequipa", scheduled_date: "2026-08-01", price: 3500, currency: "PEN",
      status: "en_route", assigned_driver_id: driverId, assigned_unit_id: unitId,
    }).select().single();
    // A pending document with a stored photo message.
    const path = `uploads/${load!.id}/mock.png`;
    await db.storage.from("guias").upload(path, Buffer.from("fake"), { contentType: "image/png" });
    const { data: msg } = await db.from("messages").insert({
      provider: "office", provider_message_sid: `office-${Date.now()}`, direction: "in",
      load_id: load!.id, media_storage_path: path, processed: true, body: "foto",
    } as never).select().single();
    const { data: doc } = await db.from("load_documents").insert({
      load_id: load!.id, message_id: (msg as { id: string }).id, doc_type: "gre_remitente",
      extracted: {}, validation: {}, review_status: "pending",
    }).select().single();

    const enriched = await extractDocument(doc!.id);

    const ex = enriched.document.extracted as Record<string, { value: string; source: string; bbox: unknown }>;
    expect(ex.peso.value).toBe("8900");
    expect(ex.peso.source).toBe("vlm");
    expect(ex.peso.bbox).toEqual([10, 10, 30, 12]);
    expect(ex.firma_presente.value).toBe("true");
    // reconciliation ran (placa "ABC-1" ≠ unit plate → a flag exists)
    const val = enriched.document.validation as { overall: string };
    expect(["green", "amber", "red"]).toContain(val.overall);
    // audit event written
    const { data: events } = await db.from("document_events").select("kind").eq("document_id", doc!.id);
    expect((events ?? []).some((e) => e.kind === "vlm_extracted")).toBe(true);
  });
});
