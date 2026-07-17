import { TemplateName } from "@tp/types";

export function renderTemplate(name: TemplateName, vars: string[]): string {
  switch (name) {
    case "asignacion": {
      const [driver, cargo, client, destination, date] = vars;
      return (
        `Hola ${driver}, tienes una nueva asignación: ${cargo} para ${client}, ` +
        `destino ${destination}, fecha ${date}. Responde *1* para aceptar o *2* para rechazar.`
      );
    }
    case "recordatorio": {
      const [driver, cargo, destination] = vars;
      return (
        `Hola ${driver}, recordatorio: aún no confirmas la asignación ${cargo} ` +
        `(destino ${destination}). Responde *1* para aceptar o *2* para rechazar.`
      );
    }
    case "reasignacion": {
      const [driver, cargo, destination] = vars;
      return (
        `Hola ${driver}, la asignación ${cargo} con destino ${destination} fue reasignada a otro conductor. ` +
        `Ya no debes realizar este viaje. Gracias.`
      );
    }
  }
}
