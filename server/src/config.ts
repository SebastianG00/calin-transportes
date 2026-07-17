import { z } from "zod";

// Twilio fields are optional/defaulted so the app can boot without WhatsApp
// creds — we only need real Twilio values once we start testing the bot.
// Supabase creds stay required: nothing in this server works without a DB.
const Env = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),
  TWILIO_WHATSAPP_FROM: z.string().default("whatsapp:+14155238886"),
  SWEEP_INTERVAL_MS: z.coerce.number().default(60000),
  PORT: z.coerce.number().default(8080),
  // .env ships this key present-but-empty until a real deploy URL exists;
  // treat "" the same as unset rather than failing url() validation.
  PUBLIC_URL: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional()),
});

export const config = Env.parse(process.env);
export type Config = z.infer<typeof Env>;
