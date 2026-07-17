import { isValidRuc } from "@tp/types";
import { getServiceClient } from "../src/db/client.js";

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
}

// Run only when invoked directly (not when imported by the test).
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
