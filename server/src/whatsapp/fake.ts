import { WhatsAppProvider, TemplateName } from "@tp/types";

export class FakeProvider implements WhatsAppProvider {
  sent: Array<{ to: string; template: TemplateName; vars: string[]; sid: string }> = [];
  private n = 0;

  async send(to: string, template: TemplateName, vars: string[]) {
    const sid = `FAKE${++this.n}`;
    this.sent.push({ to, template, vars, sid });
    return { sid };
  }
}
