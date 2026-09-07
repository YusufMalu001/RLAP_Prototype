import "dotenv/config";
import { createApp } from "./app";
import { startSlotHoldSweeper } from "./cart/slotHoldSweeper";
import { startReminderSweeper } from "./booking/reminderSweeper";

// PORT is what hosting platforms (Render/Railway/Fly) inject and require binding to;
// API_PORT is the local-dev override from .env — PORT takes precedence when both are set.
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

startSlotHoldSweeper();
startReminderSweeper();
