import { WhatsAppProvider, TemplateName } from "@tp/types";

export class FakeProvider implements WhatsAppProvider {
  sent: Array<{ to: string; template: TemplateName; vars: string[]; sid: string }> = [];
  private n = 0;

  async send(to: string, template: TemplateName, vars: string[]) {
    // Unique across process restarts (a bare counter collided with prior runs'
    // messages under the provider_message_sid unique constraint).
    const sid = `FAKE-${Date.now().toString(36)}-${++this.n}`;
    this.sent.push({ to, template, vars, sid });
    return { sid };
  }
}
