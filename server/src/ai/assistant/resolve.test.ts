import { describe, it, expect, beforeEach } from "vitest";
import { getServiceClient } from "../../db/client.js";
import { resetDb, seedDriver } from "../../testutils/db.js";
import { resolveDriverId } from "./resolve.js";
import { ClarifyError } from "./types.js";

const db = getServiceClient();

describe("resolveDriverId", () => {
  beforeEach(async () => { await resetDb(); });

  it("resolves a unique case-insensitive match to its id", async () => {
    const id = await seedDriver(); // seeds a driver named "D<n>"
    const { data } = await db.from("drivers").select("id,name").eq("id", id).single();
    const found = await resolveDriverId(db, (data!.name as string).toLowerCase());
    expect(found).toBe(id);
  });

  it("throws ClarifyError when there is no match", async () => {
    await expect(resolveDriverId(db, "Zzz-nadie")).rejects.toBeInstanceOf(ClarifyError);
  });

  it("resolves across accents (Núñez ↔ nunez)", async () => {
    const { data } = await db.from("drivers")
      .insert({ name: "José Núñez", whatsapp_phone: "+51988877766", active: true } as never)
      .select("id").single();
    // office types without accents → still resolves the accented name
    expect(await resolveDriverId(db, "jose nunez")).toBe((data as any).id);
    expect(await resolveDriverId(db, "Núñez")).toBe((data as any).id);
  });
});
