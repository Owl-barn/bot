import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { Button } from "@structs/button";
import { GuildMember } from "discord.js";

export default {
  name: "selfrole",

  async run(msg) {
    if (!msg.guildId) throw "No guild";

    const error = { ephemeral: true, content: "An error occured" };
    const user = msg.member as GuildMember | undefined;

    const buttonID = msg.customId.trim();

    if (!user) return error;

    const query = await state.db.selfrole.findFirst({
      where: { id: buttonID },
    });

    if (!query) return error;

    const hasRole = user.roles.cache.get(query.roleId);

    if (hasRole) {
      user.roles.remove(query.roleId);
      const embed = failEmbedTemplate(
        `Role <@&${query.roleId}> removed!`,
      );
      return { ephemeral: true, embeds: [embed] };
    } else {
      user.roles.add(query.roleId);
      const embed = embedTemplate(`Role <@&${query.roleId}> added!`);
      return { ephemeral: true, embeds: [embed] };
    }
  },

} as Button;
