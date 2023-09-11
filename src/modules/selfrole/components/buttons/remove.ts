import { GuildMember } from "discord.js";
import { Button } from "@structs/button";
import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { updateCollection, generateMenu } from "@modules/selfrole/lib/selfrole";
import { state } from "@app";

export default Button(

  {
    name: "role_rm",
    isGlobal: false,
  },

  async (msg) => {
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
    const components = generateMenu(
      collection,
      "selfroleRemove",
    );

    await msg.update({
      components,
      embeds: msg.message.embeds,
    });

    return { embeds: [embedTemplate("Role removed!")], ephemeral: true };
  }

);
