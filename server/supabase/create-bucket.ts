// One-off script to create the private "guias" Storage bucket via the
// Supabase JS client with the service-role key. Deviation from the task
// brief's "dashboard" step for Task 6: scripted instead, for reproducibility
// and to avoid a manual dashboard step. Idempotent — if the bucket already
// exists, this is treated as success.
//
// Usage: node --env-file=.env --import tsx supabase/create-bucket.ts
// (run from server/, or via `npm run create-bucket -w server` from repo root)

import { createClient } from "@supabase/supabase-js";

const BUCKET_NAMES = ["guias", "facturas"];

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not set");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  for (const name of BUCKET_NAMES) {
    const { data, error } = await supabase.storage.createBucket(name, { public: false });
    if (error) {
      const exists = ("statusCode" in error && (error as { statusCode?: string }).statusCode === "409")
        || /already exists/i.test(error.message ?? "");
      if (exists) console.log(`bucket "${name}" already exists — ok`);
      else throw error;
    } else {
      console.log(`created bucket "${name}"`, data);
    }
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;
    const b = buckets?.find((x) => x.name === name);
    if (!b) throw new Error(`bucket "${name}" not found after creation`);
    if (b.public !== false) throw new Error(`bucket "${name}" is not private (public=${b.public})`);
    console.log(`verified: bucket "${name}" exists, public=${b.public}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
