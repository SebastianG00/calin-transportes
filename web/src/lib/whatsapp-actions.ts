import { apiFetch } from "@/lib/api"

export type WhatsappIntent =
  | "recordar_confirmacion"
  | "pedir_foto_entrega"
  | "aviso_reasignacion"
  | "personalizado"

export function draftWhatsapp(
  loadId: string,
  body: { intent: WhatsappIntent; instruction?: string },
): Promise<{ draft: string }> {
  return apiFetch(`/api/loads/${loadId}/whatsapp-draft`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}
