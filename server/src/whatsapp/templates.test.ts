import { describe, it, expect } from "vitest";
import { renderTemplate } from "./templates.js";

describe("renderTemplate", () => {
  it("renders the assignment template in Spanish with the accept/decline prompt", () => {
    const body = renderTemplate("asignacion", ["Juan", "Cerveza", "Backus", "Arequipa", "2026-07-20"]);
    expect(body).toContain("Juan");
    expect(body).toContain("Arequipa");
    expect(body).toMatch(/responde \*1\*/i);
    expect(body).toMatch(/\*2\*/);
  });
  it("renders the reminder template", () => {
    const body = renderTemplate("recordatorio", ["Juan", "Cerveza", "Arequipa"]);
    expect(body).toMatch(/recordatorio/i);
    expect(body).toContain("Juan");
  });
  it("renders the reassignment template without an accept/decline prompt", () => {
    const body = renderTemplate("reasignacion", ["Juan", "Cerveza", "Arequipa"]);
    expect(body).toContain("reasignada");
    expect(body).toContain("Juan");
    expect(body).toContain("Arequipa");
    expect(body).not.toContain("Responde *1*");
  });
});
