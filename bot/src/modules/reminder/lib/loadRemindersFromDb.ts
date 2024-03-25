import { state } from "@app";
import { ReminderRef } from "../structs/reminderRef";

const db = state.db;

export async function loadRemindersFromDb(): Promise<ReminderRef[]> {
  const reminders = await db.reminder.findMany({ select: { id: true, triggersAt: true } });
  reminders.sort((a, b) => a.triggersAt.getTime() - b.triggersAt.getTime());
  return reminders;
}
