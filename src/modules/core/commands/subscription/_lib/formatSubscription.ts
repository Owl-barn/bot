import { state } from "@app";
import { EmbedBuilder } from "@discordjs/builders";
import { Guild, User } from "@prisma/client";
import { SubscriptionTier } from "@structs/access/subscription";

export function formatSubscriptions(embed: EmbedBuilder, user: (User & { subscribedGuilds: Guild[] }), subscription: SubscriptionTier) {
  embed.addFields([
    {
      name: `Subscribed guilds (${user.subscribedGuilds.length}/${subscription.guildLimit})`,
      value: user.subscribedGuilds.length > 0
        ? user.subscribedGuilds
          .map((x) => guildItem(x.id))
          .join("\n")
        : "You are not subscribed to any guilds at this time.",
    },
  ]);
}

function guildItem(id: string) {
  const guild = state.client.guilds.cache.get(id);
  return ` - ${guild?.name ?? `Unknown guild (${id})`}`;
}
