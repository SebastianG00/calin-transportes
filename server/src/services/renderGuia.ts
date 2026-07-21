export interface GuiaClause { title: string; body: string; bucket: "reconcile" | "verify" | "attest" }

const BUCKET_LABEL: Record<GuiaClause["bucket"], string> = {
  reconcile: "Verificación de datos",
  verify: "Verificación en la foto de retorno",
  attest: "Declaración del chofer (marcar)",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderClauses(clauses: GuiaClause[]): string {
  const byBucket: Record<string, GuiaClause[]> = {};
  for (const c of clauses) (byBucket[c.bucket] ??= []).push(c);
  const groups = (["reconcile", "verify", "attest"] as const)
    .filter((b) => byBucket[b]?.length)
    .map((b) => {
      const items = byBucket[b]
        .map((c) => `<li><strong>${esc(c.title)}</strong>: ${esc(c.body)}</li>`)
        .join("");
      return `<section class="requisito-grupo"><h3>${esc(BUCKET_LABEL[b])}</h3><ul>${items}</ul></section>`;
    })
    .join("");

  // Blank signature / receptor block — always present, signed physically on delivery.
  const firma = `
    <section class="firma">
      <h3>Recepción y conformidad</h3>
      <table class="firma-tabla">
        <tr><td>Recibido por (nombre):</td><td class="linea">&nbsp;</td></tr>
        <tr><td>DNI / documento:</td><td class="linea">&nbsp;</td></tr>
        <tr><td>Fecha y hora:</td><td class="linea">&nbsp;</td></tr>
        <tr><td>Firma:</td><td class="linea firma-espacio">&nbsp;</td></tr>
      </table>
    </section>`;

  return (groups || "") + firma;
}

export function renderGuiaHtml(input: {
  templateBody: string;
  data: Record<string, string>;
  clauses: GuiaClause[];
}): string {
  return input.templateBody.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, rawKey: string) => {
    const key = rawKey.trim();
    if (key === "requisitos") return renderClauses(input.clauses);
    const val = input.data[key];
    if (val === undefined || val === null || val === "") return `[FALTA: ${esc(key)}]`;
    return esc(String(val));
  });
}

// Default guía template when a load's client has no 'guia' template of its own.
// {{...}} keys are filled from confirmed load data by buildGuia (Task 7).
export const DEFAULT_GUIA_TEMPLATE = `
<article class="guia">
  <header>
    <h1>Guía de remisión — Constancia de entrega</h1>
    <p>Transportes Kalin</p>
  </header>
  <table class="datos">
    <tr><td>Cliente:</td><td>{{cliente}}</td><td>RUC:</td><td>{{ruc}}</td></tr>
    <tr><td>Carga:</td><td>{{carga}}</td><td>Peso:</td><td>{{peso}} kg</td></tr>
    <tr><td>Origen:</td><td>{{origen}}</td><td>Destino:</td><td>{{destino}}</td></tr>
    <tr><td>Placa:</td><td>{{placa}}</td><td>Chofer:</td><td>{{chofer}}</td></tr>
    <tr><td>Fecha programada:</td><td>{{fecha}}</td><td>Guía N°:</td><td>{{numero}}</td></tr>
  </table>
  <h2>Requisitos de la entrega</h2>
  {{requisitos}}
</article>`;
