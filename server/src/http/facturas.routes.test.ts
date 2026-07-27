import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { resetDb } from "../testutils/db.js";

const app = createApp();
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

describe("facturas routes", () => {
  beforeAll(async () => { await resetDb(); });

  it("uploads a factura, lists it, and exports CSV", async () => {
    const up = await request(app)
      .post("/api/facturas")
      .attach("file", png, { filename: "f.png", contentType: "image/png" });
    expect(up.status).toBe(201);
    expect(up.body.id).toBeTruthy();

    const list = await request(app).get("/api/facturas?status=pending");
    expect(list.status).toBe(200);
    expect(list.body.some((f: { id: string }) => f.id === up.body.id)).toBe(true);

    const csv = await request(app).get("/api/facturas/export?month=2026-07");
    expect(csv.status).toBe(200);
    expect(csv.text.split("\r\n")[0]).toContain("fecha_emision");
  });
});
