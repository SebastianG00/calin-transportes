import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, seedClient } from "../testutils/db.js";
import { getClient, updateClient, listClients } from "./clients.js";

describe("clients read/update", () => {
  beforeEach(async () => { await resetDb(); });

  it("updates contact fields including contact_email", async () => {
    const id = await seedClient();
    const updated = await updateClient(id, {
      contact_name: "Ana Ruiz", contact_phone: "+51987654321", contact_email: "ana@cliente.pe",
    });
    expect(updated.contact_email).toBe("ana@cliente.pe");
    expect((await getClient(id)).contact_name).toBe("Ana Ruiz");
    expect((await listClients()).length).toBe(1);
  });
});
