import { WhatsAppProvider } from "@tp/types";
import { TwilioProvider } from "./twilio.js";
import { FakeProvider } from "./fake.js";
import { config } from "../config.js";

let instance: WhatsAppProvider | null = null;

export function getProvider(): WhatsAppProvider {
  if (!instance) {
    instance =
      config.WHATSAPP_PROVIDER === "fake"
        ? new FakeProvider()
        : new TwilioProvider();
  }
  return instance;
}

export function setProvider(p: WhatsAppProvider) {
  instance = p;
}
