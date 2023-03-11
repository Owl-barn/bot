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

    const query = await state.db.self_role_roles.findFirst({
      where: { uuid: buttonID },
    });

    if (!query) return error;

    const hasRole = user.roles.cache.get(query.role_id);

    if (hasRole) {
      user.roles.remove(query.role_id);
      const embed = failEmbedTemplate(
        `Role <@&${query.role_id}> removed!`,
      );
      return { ephemeral: true, embeds: [embed] };
    } else {
      user.roles.add(query.role_id);
      const embed = embedTemplate(`Role <@&${query.role_id}> added!`);
      return { ephemeral: true, embeds: [embed] };
    }
  },

} as Button;
