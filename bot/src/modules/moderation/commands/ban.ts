import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import stringDurationToMs from "@lib/time";
import { ModerationType } from "@prisma/client";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  ApplicationCommandOptionType,
  APIEmbedField,
  escapeMarkdown,
} from "discord.js";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";

export default Command(

  // Info
  {
    name: "ban",
    description: "bans a user",
    group: CommandGroup.moderation,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "User to ban",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "reason",
        description: "Reason why the user is getting banned",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "duration",
        description: "Duration of the ban `0d0h`",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.Integer,
        name: "delete",
        description:
          "Number of days to delete messages, default: 1",
        required: false,
      },
    ],

    botPermissions: ["BanMembers"],

    throttling: {
      duration: 30,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    let reason = msg.options.getString("reason");
    const days = msg.options.getInteger("delete") ?? 1;
    const duration = msg.options.getString("duration");
    const target = msg.options.getUser("user");

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    reason = reason
      ? escapeMarkdown(reason).substring(0, 256)
      : "No reason provided";

    if (!target)
      return { embeds: [failEmbed.setDescription("No user provided")] };

    const guild = await state.db.guild.findUnique({ where: { id: msg.guild.id } });

    const member = await msg.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (member) {
      const isStaff =
        guild?.staffRoleId &&
        member.roles.cache.get(guild.staffRoleId);

      if (!member.bannable || isStaff)
        return {
          ephemeral: true,
          embeds: [
            failEmbed.setDescription("I cant ban that person"),
          ],
        };
    }

    // expiresOn
    let expiresOn: Date | undefined = undefined;
    const durationMs = duration ? stringDurationToMs(duration) : 0;
    if (durationMs >= 3600000) {
      expiresOn = new Date(Date.now() + durationMs);
    }

    await state.db.infraction.create({
      data: {
        expiresOn,
        reason: reason,
        moderationType: ModerationType.ban,

        target: connectOrCreate(target.id),
        moderator: connectOrCreate(msg.user.id),
        guild: connectOrCreate(msg.guild.id),
      },
    });
    const fields: APIEmbedField[] = [];
    fields.push({
      name: "Reason",
      value: `\`\`\`${reason}\`\`\``,
    });

    if (expiresOn) {
      fields.push({
        name: "Expires",
        value: `<t:${Math.round(Number(expiresOn) / 1000)}:t>`,
        inline: true,
      });
    }

    embed.setTitle(`You have been banned from "${msg.guild.name}"`);

    if (guild?.unbanNotice) {
      embed.setFields(fields);
      embed.addFields([
        {
          name: "Appeal notice",
          value: guild.unbanNotice,
        },
      ]);
    }

    const dm = await target.send({ embeds: [embed] }).catch(() => null);

    embed.setFields(fields);

    await msg.guild.bans.create(target.id, {
      reason: reason ?? undefined,
      deleteMessageSeconds: days * 24 * 60 * 60,
    });

    embed.setTitle(
      `${escapeMarkdown(target.username)} has been banned.`,
    );
    embed.addFields([
      {
        name: "Notified",
        value: dm ? "🟢 Yes" : "🔴 No",
        inline: true,
      },
    ]);
    embed.setFooter({
      text: `${target.tag} <@${target.id}>`,
      iconURL: getAvatar(target),
    });

    return { embeds: [embed] };
  }

);
