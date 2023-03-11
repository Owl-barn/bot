import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { moderation_type } from "@prisma/client";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  GuildMember,
  ApplicationCommandOptionType,
  escapeMarkdown,
} from "discord.js";

export default Command(

  // Info
  {
    name: "kick",
    description: "kicks a user",
    group: CommandGroup.moderation,

    guildOnly: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "User to kick",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "reason",
        description: "Reason why the user is getting kicked",
        required: true,
      },
    ],

    botPermissions: ["KickMembers"],

    throttling: {
      duration: 30,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guild) throw "No guild on kick??";

    let reason = msg.options.getString("reason");
    const target = msg.options.getMember("user") as GuildMember | null;

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    reason = reason
      ? escapeMarkdown(reason).substring(0, 256)
      : "No reason provided";

    if (!target)
      return { embeds: [failEmbed.setDescription("No user provided")] };

    const guild = await state.db.guilds.findUnique({ where: { guild_id: msg.guild.id } });
    const isStaff =
      guild?.staff_role &&
      target.roles.cache.get(guild.staff_role);

    if (!target.kickable || isStaff)
      return {
        ephemeral: true,
        embeds: [failEmbed.setDescription("I cant kick that person")],
      };

    await target.kick(reason?.substring(0, 128) ?? undefined);

    embed.setTitle(`User has been kicked`);
    embed.setDescription(
      `<@${target.id
      }> has been kicked with the reason: \`${escapeMarkdown(reason)}\``,
    );

    await state.db.moderation_log.create({
      data: {
        user: target.id,
        reason: reason,
        guild_id: msg.guildId as string,
        moderator: msg.user.id,
        moderation_type: moderation_type.kick,
      },
    });

    return { embeds: [embed] };
  }

);
