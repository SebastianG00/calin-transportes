# WhatsApp Production Verification — tracking

Slice 1 develops against the **Twilio sandbox** (instant, no verification).
Production needs Meta Cloud API, which has weeks of lead time. Track it here.

## Checklist
- [ ] Create/confirm Meta Business account for Transportes Kalin
- [ ] Start Meta Business verification (identity + business docs)
- [ ] Register a production phone number (WhatsApp Business API)
- [ ] Submit THREE message templates for approval (Spanish, `es`):
  - `asignacion` (assignment) — business-initiated
  - `recordatorio` (reminder) — business-initiated, no open 24h session
  - `reasignacion` (reassignment notice) — business-initiated, no open 24h session
- [ ] Record approved template names + variable order here once granted

## Template drafts (submit these)
**asignacion** (category: UTILITY):
> Hola {{1}}, tienes una nueva asignación: {{2}} para {{3}}, destino {{4}},
> fecha {{5}}. Responde *1* para aceptar o *2* para rechazar.

**recordatorio** (category: UTILITY):
> Hola {{1}}, recordatorio: aún no confirmas la asignación {{2}} (destino {{3}}).
> Responde *1* para aceptar o *2* para rechazar.

**reasignacion** (category: UTILITY):
> Hola {{1}}, la asignación {{2}} con destino {{3}} fue reasignada a otro conductor.
> Ya no debes realizar este viaje. Gracias.

## Notes
- Sandbox templates (Twilio) do not need this approval; production does.
- Variable order here MUST match `server/src/whatsapp/templates.ts`.
