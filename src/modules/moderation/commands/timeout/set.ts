import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import stringDurationToMs, { msToString } from "@lib/time";
import { ModerationType } from "@prisma/client";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  ApplicationCommandOptionType,
  escapeMarkdown,
  GuildMember,
} from "discord.js";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";

export default SubCommand(

  // Info
  {
    name: "set",
    description: "Set a timeout for a user",

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "User to put on timeout",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "duration",
        description: "for how long",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "reason",
        description: "why?",
        required: false,
      },
    ],

    botPermissions: ["ModerateMembers"],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guild) throw "No guild on timeout command";
    const timeoutLimit = 2419200000;

    let reason = msg.options.getString("reason", false);
    const duration = msg.options.getString("duration", true);
    const target = msg.options.getMember("user") as GuildMember | null;

    if (!target) return { content: "No user provided" };

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const guild = await state.db.guild.findUnique({ where: { id: msg.guild.id } });
    const isStaff =
      guild?.staffRoleId &&
      target.roles.cache.get(guild.staffRoleId);

    if (!target.moderatable || isStaff)
      return {
        embeds: [failEmbed.setDescription("I cant time-out that user")],
      };

    let durationMs = stringDurationToMs(duration);

    if (durationMs < 10 * 1000) durationMs = 60 * 1000;

    if (durationMs > timeoutLimit) durationMs = timeoutLimit;

    reason = reason
      ? escapeMarkdown(reason).substring(0, 127)
      : "No reason provided.";

    const member = await target.timeout(durationMs, reason ?? undefined);

    if (!member.communicationDisabledUntilTimestamp) throw "??";

    const durationString = msToString(durationMs);

    embed.setTitle(`You have been timed out in "${msg.guild.name}"`);
    embed.addFields([
      {
        name: "Reason",
        value: `\`\`\`${reason}\`\`\``,
      },
      {
        name: "Duration",
        value: durationString,
        inline: true,
      },
      {
        name: "Expiration",
        value: `<t:${Math.round(
          member.communicationDisabledUntilTimestamp / 1000,
        )}:R> `,
        inline: true,
      },
    ]);

    const dm = await target.send({ embeds: [embed] }).catch(() => null);

    const avatar = getAvatar(target);

    embed.setTitle("Timeout Set");
    embed.setFooter({
      text: `${target.user.tag} <@${target.id}>`,
      iconURL: avatar,
    });
    embed.addFields([
      {
        name: "Notified",
        value: dm ? "🟢 Yes" : "🔴 No",
        inline: true,
      },
    ]);

    await state.db.infraction.create({
      data: {
        reason,
        moderationType: ModerationType.timeout,
        expiresOn: new Date(Date.now() + durationMs),

        target: connectOrCreate(target.id),
        guild: connectOrCreate(msg.guild.id),
        moderator: connectOrCreate(msg.user.id),
      },
    });

    return { embeds: [embed] };
  }
);
