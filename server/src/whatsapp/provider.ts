import { WhatsAppProvider } from "@tp/types";
import { TwilioProvider } from "./twilio.js";

let instance: WhatsAppProvider | null = null;

export function getProvider(): WhatsAppProvider {
  if (!instance) instance = new TwilioProvider();
  return instance;
}

export function setProvider(p: WhatsAppProvider) {
  instance = p;
}
