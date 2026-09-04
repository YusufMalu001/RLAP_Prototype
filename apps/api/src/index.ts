import "dotenv/config";
import { createApp } from "./app";
import { startSlotHoldSweeper } from "./cart/slotHoldSweeper";
import { startReminderSweeper } from "./booking/reminderSweeper";

const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

startSlotHoldSweeper();
startReminderSweeper();
