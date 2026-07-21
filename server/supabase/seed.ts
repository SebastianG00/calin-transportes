import { isValidRuc } from "@tp/types";
import { getServiceClient } from "../src/db/client.js";
import { DEFAULT_GUIA_TEMPLATE } from "../src/services/renderGuia.js";

export interface SeedClientRow {
  name: string;
  ruc: string;
  contact_name: string | null;
  contact_phone: string | null;
}

// Replace with the 15 real Transportes Kalin clients before running in prod.
export const SEED_CLIENTS: SeedClientRow[] = [
  { name: "Backus", ruc: "20100047218", contact_name: null, contact_phone: null },
  { name: "Alicorp", ruc: "20100128056", contact_name: null, contact_phone: null },
  { name: "Gloria", ruc: "20100190797", contact_name: null, contact_phone: null },
];

export function parseSeedClients(rows: SeedClientRow[]): SeedClientRow[] {
  for (const r of rows) {
    if (!isValidRuc(r.ruc)) {
      throw new Error(`RUC inválido para cliente "${r.name}": ${r.ruc}`);
    }
  }
  return rows;
}

export const SEED_CLAUSES = [
  { title: "Camión limpio y sin olores", body: "El vehículo debe llegar limpio, seco y sin olores que afecten la carga.", bucket: "attest" },
  { title: "Chofer con EPP", body: "El conductor debe portar casco, chaleco y zapatos de seguridad durante la maniobra.", bucket: "attest" },
  { title: "Peso dentro del límite", body: "El peso transportado no debe exceder el límite acordado para la unidad.", bucket: "reconcile" },
  { title: "Firma del receptor", body: "La guía debe retornar firmada por quien recibe la mercadería.", bucket: "verify" },
];

export async function seedDocumentContent() {
  const db = getServiceClient();

  // Default guía template (client_id null). Idempotent by (kind, client_id null, name).
  const existingTpl = await db.from("document_templates").select("id")
    .eq("kind", "guia").is("client_id", null).eq("name", "Guía por defecto").maybeSingle();
  if (!existingTpl.data) {
    const { error } = await db.from("document_templates")
      .insert({ client_id: null, kind: "guia", name: "Guía por defecto", body: DEFAULT_GUIA_TEMPLATE });
    if (error) throw error;
  }

  // Global clauses (client_id null). Idempotent by (title, client_id null).
  for (const c of SEED_CLAUSES) {
    const existing = await db.from("requirement_clauses").select("id")
      .is("client_id", null).eq("title", c.title).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) {
      const { error } = await db.from("requirement_clauses")
        .insert({ client_id: null, title: c.title, body: c.body, bucket: c.bucket, source: "human" });
      if (error) throw error;
    }
  }
}

async function main() {
  const rows = parseSeedClients(SEED_CLIENTS);
  const supabase = getServiceClient();

  // Deviation from the task brief: `clients.ruc` has no unique/exclusion
  // constraint in the applied migration (0001_init.sql), so a single
  // `upsert(..., { onConflict: "ruc" })` fails with Postgres error 42P10
  // ("no unique or exclusion constraint matching the ON CONFLICT
  // specification"). Adding that constraint would mean touching a migration,
  // which is out of scope for this task. Instead, upsert-by-ruc is done
  // manually (select then insert/update) — still idempotent, no schema change.
  for (const row of rows) {
    const { data: existing, error: selectError } = await supabase
      .from("clients")
      .select("id")
      .eq("ruc", row.ruc)
      .maybeSingle();
    if (selectError) throw selectError;

    if (existing) {
      const { error } = await supabase
        .from("clients")
        .update({
          name: row.name,
          contact_name: row.contact_name,
          contact_phone: row.contact_phone,
          active: true,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("clients")
        .insert({ ...row, active: true });
      if (error) throw error;
    }
  }

  console.log(`Seeded ${rows.length} clients.`);

  await seedDocumentContent();
  console.log(`Seeded ${SEED_CLAUSES.length} global clauses + default guía template.`);
}

// Run only when invoked directly (not when imported by the test).
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
