import { state } from "@app";
import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { EmbedBuilder, GuildMember } from "discord.js";
import { localState } from "..";
import { logType } from "@lib/services/logService";

export async function toggleRole(member: GuildMember, selfRoleId: string) {
  const selfrole = await state.db.selfrole.findFirst({ where: { id: selfRoleId } });
  const error = { ephemeral: true, content: "An error occured" };

  if (!selfrole) {
    localState.log.error(`Selfrole ${selfRoleId} not found`);
    return error;
  }

  let embed: EmbedBuilder;
  let roleError;
  const hasRole = member.roles.cache.get(selfrole.roleId);

  if (hasRole) {
    await member.roles.remove(selfrole.roleId).catch((e) => roleError = e);
    embed = failEmbedTemplate(`Role <@&${selfrole.roleId}> removed!`);
  } else {
    await member.roles.add(selfrole.roleId).catch((e) => roleError = e);
    embed = embedTemplate(`Role <@&${selfrole.roleId}> added!`);
  }

  if (roleError) {
    localState.log.error(`Failed to ${hasRole ? "remove" : "add"} role: <@${member.user.tag.green}> <@!${selfrole.roleId.cyan}>`, { error: roleError });

    state.botLog.push(
      failEmbedTemplate(`Failed to ${hasRole ? "remove" : "add"} role: <@${member.user.tag.green}> <@!${selfrole.roleId.cyan}>`),
      member.guild.id,
      logType.BOT,
    );

    error.content = "Could not add/remove this role, please check the bot's permissions";
    return error;
  }

  localState.log.info(`Role ${hasRole ? "removed" : "added"}: ${member.guild.name} | <@${member.user.tag.green}> <@!${selfrole.roleId.cyan}>`);
  return { ephemeral: true, embeds: [embed] };
}
