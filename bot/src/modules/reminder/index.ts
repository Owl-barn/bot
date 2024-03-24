import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";
import { ReminderRef } from "./structs/reminderRef";
import { loadRemindersFromDb } from "./lib/loadRemindersFromDb";

export default {
  name: "reminder",
  description: "Reminder system",
  initialize,
} as Module;

interface State extends LocalState {
  reminders: ReminderRef[],
  maxReminders: number,
}

const localState = {
  maxReminders: 5,
} as State;

export { localState };

async function initialize() {
  localState.reminders = await loadRemindersFromDb();
}
