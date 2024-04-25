import { state } from "@app";
import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { AnySelectMenuInteraction, ButtonInteraction } from "discord.js";
import { updateCollection, generateInteractable } from "./selfrole";
import button from "@modules/selfrole/components/buttons/remove";

export async function removeRole(msg: ButtonInteraction | AnySelectMenuInteraction, roleId: string) {
  const query = await state.db.selfrole
    .delete({
      where: { id: roleId },
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

  if (!collection) return { embeds: [failEmbedTemplate("Collection does not exist.")], ephemeral: true };

  await updateCollection(collection);

  const components = generateInteractable(collection, button.info.name);

  await msg.update({ components });

  return { embeds: [embedTemplate("Role removed!")], ephemeral: true };
}
