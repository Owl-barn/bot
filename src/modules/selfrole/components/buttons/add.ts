import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { Button } from "@structs/button";
import { EmbedBuilder } from "discord.js";
import { localState } from "../../";

export default Button(

  {
    name: "role_add",
    isGlobal: false,
  },

  async (msg) => {
    const error = { ephemeral: true, content: "An error occured" };
    const user = msg.member;

    const buttonID = msg.customId.trim();

    if (!user) return error;

    const query = await state.db.selfrole.findFirst({ where: { id: buttonID } });

    if (!query) return error;

    let embed: EmbedBuilder;
    let roleError;
    const hasRole = user.roles.cache.get(query.roleId);

    if (hasRole) {
      await user.roles.remove(query.roleId).catch((e) => roleError = e);
      embed = failEmbedTemplate(`Role <@&${query.roleId}> removed!`);
    } else {
      await user.roles.add(query.roleId).catch((e) => roleError = e);
      embed = embedTemplate(`Role <@&${query.roleId}> added!`);
    }

    if (roleError) {
      localState.log.error(`Failed to ${hasRole ? "remove" : "add"} role: <@${user.user.tag.green}> <@!${query.roleId.cyan}>`, { error: roleError });
      error.content = "Could not add/remove this role, please check the bot's permissions";
      return error;
    }

    localState.log.info(`Role ${hasRole ? "removed" : "added"}: <@${user.user.tag.green}> <@!${query.roleId.cyan}>`);
    return { ephemeral: true, embeds: [embed] };
  }

);
