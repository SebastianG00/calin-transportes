// One-off script to create the private "guias" Storage bucket via the
// Supabase JS client with the service-role key. Deviation from the task
// brief's "dashboard" step for Task 6: scripted instead, for reproducibility
// and to avoid a manual dashboard step. Idempotent — if the bucket already
// exists, this is treated as success.
//
// Usage: node --env-file=.env --import tsx supabase/create-bucket.ts
// (run from server/, or via `npm run create-bucket -w server` from repo root)

import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "guias";

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

  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: false,
  });

  if (error) {
    // Idempotent: bucket already existing is success, not failure.
    const alreadyExists =
      "statusCode" in error && (error as { statusCode?: string }).statusCode === "409";
    const messageSaysExists = /already exists/i.test(error.message ?? "");
    if (alreadyExists || messageSaysExists) {
      console.log(`bucket "${BUCKET_NAME}" already exists — ok`);
    } else {
      throw error;
    }
  } else {
    console.log(`created bucket "${BUCKET_NAME}"`, data);
  }

  // Verify: list buckets and confirm it exists and is private.
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw listError;
  }
  const bucket = buckets?.find((b) => b.name === BUCKET_NAME);
  if (!bucket) {
    throw new Error(`bucket "${BUCKET_NAME}" not found after creation`);
  }
  if (bucket.public !== false) {
    throw new Error(`bucket "${BUCKET_NAME}" is not private (public=${bucket.public})`);
  }
  console.log(`verified: bucket "${BUCKET_NAME}" exists, public=${bucket.public}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
