import twilio from "twilio";
import { WhatsAppProvider, TemplateName } from "@tp/types";
import { config } from "../config.js";
import { renderTemplate } from "./templates.js";

export class TwilioProvider implements WhatsAppProvider {
  private client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

  async send(to: string, template: TemplateName, vars: string[]) {
    const msg = await this.client.messages.create({
      from: config.TWILIO_WHATSAPP_FROM,
      to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      body: renderTemplate(template, vars),
    });
    return { sid: msg.sid };
  }
}
