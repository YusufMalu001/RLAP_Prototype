import { sendDueReminders } from "./reminderService";

const DEFAULT_SWEEP_INTERVAL_MS = 15 * 60 * 1000; // 15 min — reminders aren't time-critical to the minute.

export function startReminderSweeper(
  intervalMs: number = DEFAULT_SWEEP_INTERVAL_MS,
): NodeJS.Timeout {
  return setInterval(() => {
    sendDueReminders()
      .then((count) => {
        if (count > 0) console.log(`[reminder-sweeper] sent ${count} reminder(s)`);
      })
      .catch((err) => console.error("[reminder-sweeper] sweep failed", err));
  }, intervalMs);
}
