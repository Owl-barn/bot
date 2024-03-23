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
}

const localState = {} as State;

export { localState };

async function initialize() {
  localState.reminders = await loadRemindersFromDb();
}
