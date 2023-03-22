import { embedTemplate, warningEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, Guild } from "discord.js";
import { formatSubscriptions } from "../_lib/formatSubscription";
import { updateSubscription } from "../_lib/updateSubscription";
import { SubscriptionTierKey, subscriptionTiers } from "@structs/access/subscription";

export default SubCommand(

  // Info
  {
    name: "remove",
    description: "remove a guild from your subscription",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "guild_id",
        description: "The ID of the guild you want to remove",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    // Get guild
    let guild: Guild | null;
    const guildId = msg.options.getString("guild_id");
    if (!guildId) guild = msg.guild;
    else {
      guild = await state.client.guilds.fetch(guildId);
      if (!guild) return { embeds: [warningEmbedTemplate("Sorry, I couldn't find that guild, are you sure the ID is correct and i am also in that server?")] };
    }

    // Check if user has a subscription
    const user = await state.db.user.findFirst({
      where: { id: msg.user.id, NOT: { subscriptionTier: null } },
      include: { subscribedGuilds: true },
    });

    if (!user) return { embeds: [warningEmbedTemplate("You do not currently have a subscription.")] };

    // Check if user is subscribed to that guild
    const guildSubscribed = user.subscribedGuilds.find((subscribedGuild) => subscribedGuild.id === guild?.id);
    if (!guildSubscribed) return { embeds: [warningEmbedTemplate("You are not subscribed to that guild.")] };
    const subscription = subscriptionTiers[user.subscriptionTier as SubscriptionTierKey];

    // Remove guild from user's subscriptions
    const removedGuild = await updateSubscription(guild.id, user.id, null);
    user.subscribedGuilds = user.subscribedGuilds.filter((subscribedGuild) => subscribedGuild.id !== removedGuild.id);

    // Send success message
    const embed = embedTemplate();
    embed.setTitle("Subscription");
    embed.setDescription(`You have successfully unsubscribed from "**${guild?.name}**".`);
    formatSubscriptions(embed, user, subscription);

    return { embeds: [embed] };

  }
);
