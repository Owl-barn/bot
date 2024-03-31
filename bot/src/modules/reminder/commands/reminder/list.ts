import { state } from "@app";
import { embedTemplate } from "@lib/embedTemplate";
import { SubCommand } from "@structs/command/subcommand";

const db = state.db;

export default SubCommand(

  // Info
  {
    name: "list",
    description: "List your reminders",

    isGlobal: true,

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const embed = embedTemplate()
      .setTitle("Reminder List");

    const reminders = await db.reminder.findMany({
      where: { userId: msg.user.id },
      orderBy: { triggersAt: "asc" },
    });

    if (reminders.length === 0) {
      embed.setDescription("You have no reminders");
      return { embeds: [embed] };
    }

    const reminderFields = reminders.map((reminder, index) => ({
      name: `${index + 1}. ${reminder.messageUrl} at <t:${Math.round(reminder.triggersAt.getTime() / 1000)}>`,
      value: reminder.description ?? "*No description set*",
    }));

    embed.addFields(reminderFields);
    return { embeds: [embed] };
  }
);
