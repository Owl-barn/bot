import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { DateTime } from "luxon";
import { formatBirthdayEmbed } from "@modules/birthday/lib/format";
import { TimezoneAutocomplete } from "@modules/birthday/lib/autocomplete";

export default SubCommand(

  // Info
  {
    name: "set",
    description: "Add your birthday to this server",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "timezone",
        description: "Your timezone/city",
        autoComplete: TimezoneAutocomplete,
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Number,
        name: "day",
        description: "The day you were born on, in the format of `DD`",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Number,
        name: "month",
        description: "The month you were born in, in the format of `MM`",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Number,
        name: "year",
        description: "The year you were born in, in the format of `YYYY`",
        required: true,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const day = msg.options.getNumber("day", true);
    const month = msg.options.getNumber("month", true);
    const year = msg.options.getNumber("year", true);
    const zone = msg.options.getString("timezone", true);


    let embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const date = DateTime.fromObject({ day, month, year }, { zone });
    const dateNoZone = DateTime.fromObject({ day, month, year });

    // Check if the date is valid
    if (date.isValid === false) {
      failEmbed.setDescription("Invalid Date");
      return { embeds: [failEmbed] };
    }

    // Check if the date is in the future
    if (date.millisecond > Date.now()) {
      failEmbed.setDescription("That date is in the future");
      return { embeds: [failEmbed], ephemeral: true };
    }

    const hasBirthday = await state.db.birthday.findUnique({
      where: {
        userId_guildId: {
          userId: msg.user.id,
          guildId: msg.guildId,
        },
      },
    });

    // TODO: remove isLegacy after a certain amount of time?
    if (hasBirthday && !hasBirthday.isLegacy && Date.now() - Number(hasBirthday.updatedAt) > 600000) {
      failEmbed.setDescription(
        "You can only change your birthday once a year, contact an admin if there was a mistake",
      );
      return { embeds: [failEmbed] };
    }

    // Upsert the birthday
    const query = await state.db.birthday.upsert({
      where: {
        userId_guildId: {
          userId: msg.user.id,
          guildId: msg.guildId,
        },
      },
      create: {
        date: dateNoZone.toJSDate(),
        timezone: zone,
        user: connectOrCreate(msg.user.id),
        guild: {
          connect: { id: msg.guild?.id },
        },
      },
      update: {
        date: dateNoZone.toJSDate(),
        timezone: zone,
        updatedAt: undefined,
      },
    });

    if (!query.date) throw new Error("No date???");

    embed.setTitle("Birthday set!");
    embed = formatBirthdayEmbed(embed, query);

    return { embeds: [embed] };
  }
);
