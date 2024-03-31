import { state } from "@app";
import { cron } from "@structs/cron";
import { localState } from "..";
import { deleteReminder } from "../lib/deleteReminder";
import { embedTemplate } from "@lib/embedTemplate";

const db = state.db;

export default cron(
  {
    name: "ReminderTrigger",
    // check every 15 seconds
    time: "*/15 * * * * *",
  },

  async () => {
    const currentTime = Date.now();

    let updatedCount = 0;
    while (localState.reminders.length > 0 && currentTime >= localState.reminders[0].triggersAt.getTime()) {
      const reminderRef = localState.reminders.shift();
      if (reminderRef === undefined)
        throw "reminder ref is somehow undefined";

      const reminder = await db.reminder.findFirst({ where: { id: reminderRef.id } });
      if (!reminder) {
        localState.log.error(`Reminder ${reminderRef.id} does not exist in the database`);
        continue;
      }

      await deleteReminder(reminder.id);

      const user = await state.client.users.fetch(reminder.userId);
      if (!user) {
        localState.log.error(`Failed to send reminder ${reminderRef.id} because user ${reminder.userId} does not exist`);
        continue;
      }

      const embed = embedTemplate()
        .setTitle("Reminder")
        .setDescription(`Here is your reminder in ${reminder.messageUrl} from <t:${Math.round(reminder.createdAt.getTime() / 1000)}>`);

      if (reminder.description)
        embed.addFields({ name: "Description", value: reminder.description });

      const sentMessage = await user.send({ embeds: [ embed ] }).catch(() => null);
      if (!sentMessage) {
        localState.log.error(`Failed to send reminder ${reminderRef.id} to ${user.username} (${reminder.userId})`);
        continue;
      }

      updatedCount++;
    }

    if (updatedCount > 0)
      localState.log.debug(`Sent ${updatedCount} reminders`);
  },
);
