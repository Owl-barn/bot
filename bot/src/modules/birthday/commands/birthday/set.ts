import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { DateTime } from "luxon";
import { formatBirthdayEmbed } from "@modules/birthday/lib/format";
import { TimezoneAutocomplete } from "@modules/birthday/lib/autocomplete";
import { getAvatar } from "@lib/functions";

const lockoutMinutes = 15;

export default SubCommand(

  // Info
  {
    name: "set",
    description: "Set your birthday on the bot",

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

    // Validate timezone
    if (!Intl.supportedValuesOf("timeZone").includes(zone))
      return { embeds: [failEmbed.setDescription("Invalid Timezone")], ephemeral: true };

    const date = DateTime.fromObject({ day, month, year }, { zone });
    const dateNoZone = DateTime.fromObject({ day, month, year });

    // Check if the date is valid
    if (date.isValid === false) {
      failEmbed.setDescription("Invalid Date");
      return { embeds: [failEmbed], ephemeral: true };
    }

    // Check if the date is in the future
    if (date.millisecond > Date.now()) {
      failEmbed.setDescription("That date is in the future");
      return { embeds: [failEmbed], ephemeral: true };
    }

    const hasBirthday = await state.db.user.findUnique({
      where: {
        id: msg.user.id,
        birthdate: { not: null },
      },
    });

    const isSameDate = hasBirthday?.birthdate?.getTime() === dateNoZone.toJSDate().getTime();
    const isPastLockout = Date.now() - Number(hasBirthday?.birthdayUpdatedAt) < lockoutMinutes * 60 * 1000;

    if (hasBirthday && hasBirthday.timezone !== null && !isSameDate && isPastLockout) {
      failEmbed.setDescription(
        "You can only change your birthday once a year, contact an admin if there was a mistake",
      );
      return { embeds: [failEmbed] };
    }

    // Upsert the birthday
    const query = await state.db.user.upsert({
      where: { id: msg.user.id },
      create: {
        id: msg.user.id,
        birthdate: dateNoZone.toJSDate(),
        timezone: zone,
        birthdayUpdatedAt: new Date(),
        UserGuildConfig: {
          connectOrCreate: {
            where: { userId_guildId: { guildId: msg.guild.id, userId: msg.user.id } },
            create: { guildId: msg.guild.id, birthdayEnabled: true },
          },
        },
      },
      update: {
        birthdate: dateNoZone.toJSDate(),
        birthdayUpdatedAt: new Date(),
        timezone: zone,
        UserGuildConfig: {
          connectOrCreate: {
            where: { userId_guildId: { guildId: msg.guild.id, userId: msg.user.id } },
            create: { guildId: msg.guild.id, birthdayEnabled: true },
          },
        },
      },
    });

    embed.setTitle("Birthday set!");
    if (query.birthdate === null || !query.timezone) throw new Error("No date???");
    embed = formatBirthdayEmbed(embed, { birthdate: query.birthdate, timezone: query.timezone });
    embed.setThumbnail(getAvatar(msg.member ?? msg.user) || null);

    embed.addFields([
      {
        name: "Note",
        value: `You have **${lockoutMinutes} minutes** to correct any mistakes, after that you will have to wait a year to change it again.\n use \`/birthday toggle\` in any other server you'd like to enable birthday notifications in.`,
        inline: false,
      },
    ]);

    return { embeds: [embed] };
  }
);
