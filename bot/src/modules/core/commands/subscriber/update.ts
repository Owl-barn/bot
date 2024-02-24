import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { subscriptionTiers } from "@structs/access/subscription";
import { CommandGroup } from "@structs/command";

export default SubCommand(

  // Info
  {
    name: "update",
    description: "update someone's subscription",
    group: CommandGroup.owner,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "user",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "tier",
        description: "subscription tier",
        required: true,
        choices: Object
          .entries(subscriptionTiers)
          .map(([key, value]) => ({ name: value.name, value: key })),
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const target = msg.options.getUser("user", true);
    const tierInput = msg.options.getString("tier", true) as keyof typeof subscriptionTiers;
    const tier = tierInput === "default" ? null : Number(tierInput);

    const user = await state.db.user.findUnique({
      where: { id: target.id },
      include: { subscribedGuilds: true },
    });

    if (!user) {
      await state.db.user.create({
        data: {
          id: target.id,
          subscriptionTier: tier,
          subscribedSince: new Date(),
        },
      });

      return { content: `Created user ${target.tag} with subscription tier ${tierInput}` };
    }

    const oldTier = (user.subscriptionTier ? String(user.subscriptionTier) : "default") as keyof typeof subscriptionTiers;
    const oldTierName = subscriptionTiers[oldTier]?.name ?? "Default";
    const exceedsGuildLimit = user.subscribedGuilds.length > subscriptionTiers[tierInput].guildLimit;
    const subscribedSince = tier === null ? null : user.subscribedSince ?? new Date();

    // Update the subscription for user and guilds
    await state.db.$transaction([
      state.db.user.update({
        where: { id: target.id },
        data: {
          subscriptionTier: tier,
          subscribedSince,
        },
      }),
      state.db.guild.updateMany({
        where: { subscribedUserId: user.id },
        data: {
          subscriptionTier: exceedsGuildLimit ? null : tier,
          subscribedUserId: (exceedsGuildLimit || tier === null) ? null : user.id,
        },
      }),
    ]);

    // Get guilds that were changed
    const changedGuilds = await state.db.guild.findMany({
      where: { id: { in: user.subscribedGuilds.map(g => g.id) } },
    });

    // Update guilds in cache
    for (const guild of changedGuilds) {
      state.guilds.set(guild.id, guild);
    }

    return { content: `Updated user ${target.tag} from ${oldTierName} to ${subscriptionTiers[tierInput]?.name ?? "Default"}${exceedsGuildLimit ? ", Exceeded guild limit" : ""}` };
  }

);
