import { state } from "@app";
import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import stringDurationToMs, { msToString } from "@lib/time";
import { localState } from "@modules/reminder";
import { createReminder } from "@modules/reminder/lib/createReminder";
import { Reminder } from "@prisma/client";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, ButtonInteraction, ChatInputCommandInteraction } from "discord.js";

const db = state.db;

export default SubCommand(

  // Info
  {
    name: "set",
    description: "Set a new reminder",

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "in",
        description: "When should you be reminded?",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "description",
        description: "Description to add to the reminder",
        required: false,
      },
    ],

    throttling: {
      duration: 5 * 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const description = msg.options.getString("description", false);

    const timeoutString = msg.options.getString("in", true);
    const timeoutMs = stringDurationToMs(timeoutString);
    if (timeoutMs == 0)
      return { embeds: [ failEmbedTemplate("Invalid time specified") ] };

    const reminderCount = await db.reminder.count({ where: { userId: msg.user.id } });
    if (reminderCount >= localState.maxReminders)
      return { embeds: [ failEmbedTemplate(`You can only have a maximum of ${localState.maxReminders} reminders at a time`) ] };

    const timeoutDate = new Date(Date.now() + timeoutMs);
    const entry = await createReminder(msg.user, timeoutDate, description);

    const timeoutFormatted = msToString(timeoutMs);
    const embed = embedTemplate()
      .setTitle("Reminder set")
      .setDescription(`You will be reminded in ${timeoutFormatted} on the <t:${Math.round(timeoutDate.getTime() / 1000)}>`)
      .setFooter({ text: "You will be reminded via DM, make sure you can receive DMs from the bot!" });

    return {
      embeds: [embed],
      callback: (interaction) => interactionCallback(entry, interaction),
    };
  }
);

const interactionCallback = async (entry: Reminder, interaction: ChatInputCommandInteraction | ButtonInteraction) => {
  const reply = await interaction.fetchReply();
  await db.reminder.update({
    where: {
      id: entry.id,
    },
    data: {
      messageUrl: reply.url,
    },
  });
};
