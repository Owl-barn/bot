import { state } from "@app";
import { localState } from "..";

const db = state.db;

export async function deleteReminder(reminderId: string) {
  await db.reminder.delete({ where: { id: reminderId } });
  localState.reminders = localState.reminders.filter((reminder) => reminder.id !== reminderId);
}
