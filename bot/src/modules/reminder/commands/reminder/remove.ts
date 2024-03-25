import { state } from "@app";
import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { deleteReminder } from "@modules/reminder/lib/deleteReminder";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

const db = state.db;

export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Remove a reminder",

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "position",
        description: "The position of the reminder in your reminder list to remove",
        required: true,
        min: 1,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const position = msg.options.getInteger("position", true);
    if (position <= 0)
      throw "position is less than 1";

    const reminder = await db.reminder.findFirst({
      where: { userId: msg.user.id },
      orderBy: { triggersAt: "asc" },
      skip: position - 1,
    });

    if (!reminder)
      return { embeds: [ failEmbedTemplate("Reminder does not exist") ] };

    deleteReminder(reminder.id);

    const embed = embedTemplate()
      .setTitle("Reminder removed")
      .setDescription(`Your reminder for ${reminder.messageUrl} has been removed`);

    return { embeds: [embed] };
  }
);
