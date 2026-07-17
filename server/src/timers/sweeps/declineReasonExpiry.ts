import type { Sweep } from "../runner.js";
import { deleteExpiredPrompts } from "../../db/prompts.js";

export const declineReasonExpirySweep: Sweep = {
  name: "declineReasonExpiry",
  async run() {
    return { acted: await deleteExpiredPrompts() };
  },
};
