import { state } from "@app";
import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import stringDurationToMs, { msToString } from "@lib/time";
import { createReminder } from "@modules/reminder/lib/createReminder";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

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
      duration: 60,
      usages: 1,
    },
  },

  // Execute
  async (msg) => {
    const description = msg.options.getString("description", false);

    const timeoutString = msg.options.getString("in", true);
    const timeoutMs = stringDurationToMs(timeoutString);
    if (timeoutMs == 0)
      return { embeds: [ failEmbedTemplate("Invalid time specified") ] };

    const timeoutDate = new Date(Date.now() + timeoutMs);
    const entryId = await createReminder(msg.user, timeoutDate, description);

    const timeoutFormatted = msToString(timeoutMs);
    const embed = embedTemplate()
      .setTitle("Reminder set")
      .setDescription(`You will be reminded in ${timeoutFormatted} on the <t:${Math.round(timeoutDate.getTime() / 1000)}>`)
      .setFooter({ text: "You will be reminded via DM, make sure you can receive DMs from the bot!" });

    return {
      embeds: [embed],
      callback: async (interaction) => {
        const reply = await interaction.fetchReply();
        await db.reminder.update({
          where: {
            id: entryId,
          },
          data: {
            messageUrl: reply.url,
          },
        });
      },
    };
  }
);
