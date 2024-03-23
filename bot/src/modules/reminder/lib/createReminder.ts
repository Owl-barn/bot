import { state } from "@app";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { User } from "discord.js";
import { localState } from "..";

const db = state.db;

export async function createReminder(user: User, triggersAt: Date, description: string | null): Promise<string> {
  const entry = await db.reminder.create({
    data: {
      description,
      triggersAt,
      user: connectOrCreate(user.id),
    },
  });

  const toInsert = { id: entry.id, triggersAt };
  // find the first reminder ref that would occur later than this reminder
  const index = localState.reminders.findIndex((reminderRef) => reminderRef.triggersAt.getTime() > triggersAt.getTime());
  if (index === -1) {
    // if index is -1, that means that all existing reminders occur before this reminder, thus this reminder needs to be last
    localState.reminders.push(toInsert);
  } else {
    // there is a reminder that occurs after this reminder, thus we insert this reminder before that reminder
    localState.reminders.splice(index, 0, toInsert);
  }

  return entry.id;
}
