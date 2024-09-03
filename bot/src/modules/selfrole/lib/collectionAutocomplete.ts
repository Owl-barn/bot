import { state } from "@app";
import { AutocompleteInteraction } from "discord.js";

export async function collectionAutocomplete(msg: AutocompleteInteraction, value: string) {
  if (!msg.guildId) return [];
  const collections = await state.db.selfroleCollection.findMany({
    where: {
      guildId: msg.guildId,
      OR: [
        { title: { contains: value, mode: "insensitive" } },
        { id: { startsWith: value } },
      ],
    },
    take: 25,
  });

  return collections.map((collection) => ({
    name: collection.title ?? collection.id,
    value: collection.id,
  }));
}
