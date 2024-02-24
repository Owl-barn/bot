import { state } from "@app";
import { embedTemplate } from "@lib/embedTemplate";
import { subscriptionTiers } from "@structs/access/subscription";
import { CommandGroup } from "@structs/command";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "list",
    description: "List all subscribers",
    group: CommandGroup.owner,

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async () => {
    const subscribers = await state.db.user.findMany({
      where: { subscriptionTier: { not: null } },
      include: { subscribedGuilds: true },

      orderBy: { subscribedSince: "desc" },
    });

    const embed = embedTemplate();
    embed.setTitle("Subscribers");
    embed.setDescription(
      subscribers
        .map((subscriber) => {
          const guilds = subscriber.subscribedGuilds.map((guild) => guild.id);
          const tier = subscriptionTiers[(subscriber.subscriptionTier ?? "default") as keyof typeof subscriptionTiers];
          const since = Math.round(Number(subscriber.subscribedSince) / 1000);
          return `- <@${subscriber.id}> ${tier.name} (${guilds.length}/${tier.guildLimit}) <t:${since}:R>`;
        }
        )
        .join("\n")
    );

    return { embeds: [embed] };
  }
);
