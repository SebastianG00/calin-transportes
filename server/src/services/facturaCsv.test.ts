import { describe, it, expect } from "vitest";
import { toCsv, facturasToCsv } from "./facturaCsv.js";

describe("toCsv", () => {
  it("quotes fields containing comma, quote, or newline", () => {
    const csv = toCsv(["a", "b"], [["x,y", 'he said "hi"'], ["plain", "l1\nl2"]]);
    expect(csv).toBe(
      'a,b\r\n"x,y","he said ""hi"""\r\nplain,"l1\nl2"',
    );
  });
});

describe("facturasToCsv", () => {
  it("emits the fixed accountant header and one row per factura", () => {
    const csv = facturasToCsv([{
      fecha_emision: "2026-07-10", ruc_emisor: "20100047218", razon_social: "ACME SAC",
      serie: "F001", numero: "000123", moneda: "PEN", subtotal: "1000", igv: "180",
      total: "1180", cliente: "Cliente Uno", factura_id: "abc",
    }]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("fecha_emision,ruc_emisor,razon_social,serie,numero,moneda,subtotal,igv,total,cliente,factura_id");
    expect(lines[1]).toBe("2026-07-10,20100047218,ACME SAC,F001,000123,PEN,1000,180,1180,Cliente Uno,abc");
  });

  it("returns just the header for an empty set", () => {
    expect(facturasToCsv([]).split("\r\n")).toHaveLength(1);
  });
});
