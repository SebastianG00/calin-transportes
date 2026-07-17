export type LoadStatus =
  | "unassigned" | "sent" | "confirmed" | "en_route" | "delivered" | "cancelled";

export type EventSource = "office" | "driver" | "timer" | "system";

export const ACTIVE_STATUSES: LoadStatus[] = ["sent", "confirmed", "en_route"];

const LEGAL: Record<LoadStatus, LoadStatus[]> = {
  unassigned: ["sent", "cancelled"],
  sent: ["confirmed", "unassigned", "cancelled"],
  confirmed: ["en_route", "unassigned", "cancelled"],
  en_route: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function isLegalTransition(from: LoadStatus, to: LoadStatus): boolean {
  return LEGAL[from]?.includes(to) ?? false;
}
