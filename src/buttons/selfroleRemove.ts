import { ButtonStyle, GuildMember } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../lib/embedTemplate";
import { generateButtons, updateCollection } from "../lib/selfrole";
import RavenButton from "../types/button";
import { returnMessage } from "../types/Command";
import { RavenButtonInteraction } from "../types/interaction";

export default class implements RavenButton {
  disabled: boolean;
  name = "selfroleRemove";

  async execute(msg: RavenButtonInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guild";

    const error = { ephemeral: true, content: "An error occured" };
    const client = msg.client;
    const user = msg.member as GuildMember | undefined;

    const buttonID = msg.customId.trim();

    if (!user) return error;

    const query = await client.db.self_role_roles
      .delete({
        where: { uuid: buttonID },
      })
      .catch(() => null);

    if (!query)
      return {
        embeds: [failEmbedTemplate("Role does not exist.")],
        ephemeral: true,
      };

    const collection = await msg.client.db.self_role_main.findUnique({
      where: { uuid: query.main_uuid },
      include: { self_role_roles: true },
    });

    if (!collection) return error;

    await updateCollection(collection, msg.client);

    // Generate buttons.
    const components = generateButtons(
      collection,
      "selfroleRemove",
      ButtonStyle.Danger,
    );

    await msg.update({
      components,
      embeds: msg.message.embeds,
    });

    return { embeds: [embedTemplate("Role removed!")], ephemeral: true };
  }
}
