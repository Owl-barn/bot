import { ButtonStyle, GuildMember } from "discord.js";
import { Button } from "@structs/button";
import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { updateCollection, generateButtons } from "../lib/selfrole";
import { state } from "@app";

export default {
  name: "role_rm",

  async run(msg) {
    const error = { ephemeral: true, content: "An error occured" };
    const user = msg.member as GuildMember | undefined;

    const buttonID = msg.customId.trim();

    if (!user) return error;

    const query = await state.db.selfrole
      .delete({
        where: { id: buttonID },
      })
      .catch(() => null);

    if (!query)
      return {
        embeds: [failEmbedTemplate("Role does not exist.")],
        ephemeral: true,
      };

    const collection = await state.db.selfroleCollection.findUnique({
      where: { id: query.collectionId },
      include: { roles: true },
    });

    if (!collection) return error;

    await updateCollection(collection);

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
  },

} as Button;
