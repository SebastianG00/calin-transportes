import type { Sweep } from "../runner.js";
import { claimNoResponse, claimReminder } from "../../db/loads.js";
import { getSettings } from "../../db/settings.js";
import { getProvider } from "../../whatsapp/provider.js";
import { getServiceClient } from "../../db/client.js";
import { insertMessage } from "../../db/messages.js";
import { renderTemplate } from "../../whatsapp/templates.js";
import { logger } from "../../logger.js";

export const noResponseSweep: Sweep = {
  name: "noResponse",
  async run() {
    // Step A: flag overdue loads (each row won by exactly one instance).
    const flagged = await claimNoResponse();
    // Step B: independent claim-before-send for reminders.
    const settings = await getSettings();
    let acted = flagged.length;
    if (settings.reminder_enabled) {
      const toRemind = await claimReminder();
      const provider = getProvider();
      for (const load of toRemind) {
        const { data: driver } = await getServiceClient()
          .from("drivers")
          .select("*")
          .eq("id", load.assigned_driver_id)
          .single();
        if (!driver) continue;
        try {
          const { sid } = await provider.send(driver.whatsapp_phone, "recordatorio", [
            driver.name,
            load.cargo_description,
            load.destination,
          ]);
          await insertMessage({
            provider: "twilio",
            provider_message_sid: sid,
            direction: "out",
            to_phone: driver.whatsapp_phone,
            driver_id: driver.id,
            load_id: load.id,
            template_name: "recordatorio",
            body: renderTemplate("recordatorio", [driver.name, load.cargo_description, load.destination]),
            status: "sent",
          });
        } catch (err) {
          logger.error({ err, load: load.id }, "reminder send failed");
        }
        acted++;
      }
    }
    return { acted };
  },
};
