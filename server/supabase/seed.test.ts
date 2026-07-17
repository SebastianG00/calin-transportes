import { describe, it, expect } from "vitest";
import { parseSeedClients } from "./seed.js";

describe("parseSeedClients", () => {
  it("passes rows with valid RUCs through", () => {
    const rows = [{ name: "Backus", ruc: "20100047218", contact_name: null, contact_phone: null }];
    expect(parseSeedClients(rows)).toHaveLength(1);
  });
  it("throws on an invalid RUC, naming the client", () => {
    const rows = [{ name: "MalCliente", ruc: "20131312954", contact_name: null, contact_phone: null }];
    expect(() => parseSeedClients(rows)).toThrowError(/MalCliente/);
  });
});
