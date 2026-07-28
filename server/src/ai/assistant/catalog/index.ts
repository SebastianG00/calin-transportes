import type { QueryTool } from "../types.js";
import { loadsTools } from "./loads.js";
import { entityTools } from "./entities.js";
import { moneyTools } from "./money.js";
import { fleetTools } from "./fleet.js";

export const CATALOG: QueryTool[] = [...loadsTools, ...entityTools, ...moneyTools, ...fleetTools];
export const CATALOG_NAMES = CATALOG.map((t) => t.name);
