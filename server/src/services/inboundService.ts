import { normalizeE164 } from "@tp/types";
import { messageExists, insertMessage } from "../db/messages.js";
import { findDriverByPhone } from "../db/drivers.js";
import { findActiveSentLoadByDriver, updateLoad, appendEvent } from "../db/loads.js";
import { findLivePrompt, deletePrompt, insertPrompt } from "../db/prompts.js";
import { getSettings } from "../db/settings.js";
import { getServiceClient } from "../db/client.js";
import { logger } from "../logger.js";

export interface InboundPayload { sid: string; from: string; body: string; mediaUrl?: string | null; raw: unknown; }

function intent(body: string): "accept" | "decline" | "other" {
  const t = body.trim().toLowerCase();
  if (t.startsWith("1")) return "accept";
  if (t.startsWith("2")) return "decline";
  return "other";
}

async function downloadMedia(url: string, sid: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const path = `inbound/${sid}.jpg`;
    const { error } = await getServiceClient().storage.from("guias").upload(path, buf, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    return path;
  } catch (err) { logger.error({ err, sid }, "media download failed"); return null; }
}

export async function processInbound(p: InboundPayload): Promise<{ reply: string | null }> {
  // 1. Idempotency — before any side effect.
  if (await messageExists(p.sid)) return { reply: null };
  const phone = normalizeE164(p.from);

  // 2. Media bytes → private Storage (Slice-2 seam).
  const storagePath = p.mediaUrl ? await downloadMedia(p.mediaUrl, p.sid) : null;

  const driver = await findDriverByPhone(phone);

  // 3. Persist the inbound message (driver may be null).
  await insertMessage({
    provider: "twilio", provider_message_sid: p.sid, direction: "in",
    from_phone: phone, driver_id: driver?.id ?? null, load_id: null,
    body: p.body, media_url: p.mediaUrl ?? null, media_storage_path: storagePath,
    processed: false, raw_payload: p.raw,
  } as any);

  if (!driver) { logger.info({ phone }, "inbound from unknown number"); return { reply: "Número no reconocido. Contacta a la oficina." }; }

  // 4. Active load takes precedence over any stale decline-reason prompt.
  const load = await findActiveSentLoadByDriver(driver.id);
  if (load) {
    const kind = intent(p.body);
    if (kind === "accept") {
      const { error } = await updateLoad(load.id, { status: "confirmed", no_response: false, confirmed_at: new Date().toISOString() });
      if (error) throw error;
      await appendEvent(load.id, "sent", "confirmed", "driver", driver.id, null);
      await getServiceClient().from("messages").update({ load_id: load.id }).eq("provider_message_sid", p.sid);
      return { reply: "¡Confirmada! Buen viaje." };
    }
    if (kind === "decline") {
      const { error } = await updateLoad(load.id, { status: "unassigned", assigned_driver_id: null, assigned_unit_id: null, no_response: false, confirm_due_at: null });
      if (error) throw error;
      const ev = await appendEvent(load.id, "sent", "unassigned", "driver", driver.id, "rechazada por el conductor");
      const settings = await getSettings();
      const expires = new Date(Date.now() + settings.confirm_window_minutes * 60_000).toISOString();
      await insertPrompt(driver.id, "decline_reason", ev.id, expires);
      return { reply: "Entendido, rechazaste la carga. ¿Por qué? (opcional)" };
    }
    if (p.mediaUrl) return { reply: "Recibimos tu foto, gracias." };
    return { reply: "Responde *1* para aceptar o *2* para rechazar." };
  }

  // 5. No active load — check for an open decline-reason window.
  const prompt = await findLivePrompt(driver.id, "decline_reason");
  if (prompt) {
    // APPEND-ONLY (§2): load_events is never mutated. Capture the reason as a
    // brand-new event referencing the same load, not an UPDATE of the decline event.
    if (prompt.target_event_id) {
      const { data: tgt, error } = await getServiceClient()
        .from("load_events").select("load_id").eq("id", prompt.target_event_id).single();
      if (error) throw error;
      if (tgt) await appendEvent(tgt.load_id, null, null, "driver", driver.id, p.body);
    }
    await deletePrompt(prompt.id);
    return { reply: "Gracias, registramos el motivo." };
  }

  if (p.mediaUrl) return { reply: "Recibimos tu foto, gracias." };
  return { reply: "No tienes una asignación pendiente por confirmar." };
}
