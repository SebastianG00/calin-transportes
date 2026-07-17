import { createApp } from "./http/app.js";
import { startRunner } from "./timers/runner.js";
import { noResponseSweep } from "./timers/sweeps/noResponse.js";
import { declineReasonExpirySweep } from "./timers/sweeps/declineReasonExpiry.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const app = createApp();
app.listen(config.PORT, () => logger.info({ port: config.PORT }, "server listening"));
const stop = startRunner(config.SWEEP_INTERVAL_MS, [noResponseSweep, declineReasonExpirySweep]);
process.on("SIGTERM", () => { stop(); process.exit(0); });
