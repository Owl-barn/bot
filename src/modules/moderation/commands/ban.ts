import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import stringDurationToMs from "@lib/time";
import { moderation_type } from "@prisma/client";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  ApplicationCommandOptionType,
  APIEmbedField,
  escapeMarkdown,
} from "discord.js";

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
    if (!msg.guild) throw "No guild on ban??";
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

    const guild = await state.db.guilds.findUnique({ where: { guild_id: msg.guild.id } });

    const member = await msg.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (member) {
      const isStaff =
        guild?.staff_role &&
        member.roles.cache.get(guild.staff_role);

      if (!member.bannable || isStaff)
        return {
          ephemeral: true,
          embeds: [
            failEmbed.setDescription("I cant ban that person"),
          ],
        };
    }

    // Expiry
    let expiry: Date | undefined = undefined;
    const durationMs = duration ? stringDurationToMs(duration) : 0;
    if (durationMs >= 3600000) {
      expiry = new Date(Date.now() + durationMs);
    }

    await state.db.moderation_log.create({
      data: {
        expiry,
        reason: reason,
        user: target.id,
        moderator: msg.user.id,
        guild_id: msg.guildId as string,
        moderation_type: moderation_type.ban,
      },
    });
    const fields: APIEmbedField[] = [];
    fields.push({
      name: "Reason",
      value: `\`\`\`${reason}\`\`\``,
    });

    if (expiry) {
      fields.push({
        name: "Expires",
        value: `<t:${Math.round(Number(expiry) / 1000)}:t>`,
        inline: true,
      });
    }

    embed.setTitle(`You have been banned from "${msg.guild.name}"`);

    if (guild?.unban_notice) {
      embed.setFields(fields);
      embed.addFields([
        {
          name: "Appeal notice",
          value: guild.unban_notice,
        },
      ]);
    }

    const dm = await target.send({ embeds: [embed] }).catch(() => null);

    embed.setFields(fields);

    await msg.guild.bans.create(target.id, {
      reason: reason ?? undefined,
      deleteMessageDays: days,
    });

    embed.setTitle(
      `${target.username}#${target.discriminator} has been banned.`,
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
