import { embedTemplate, warningEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, Guild } from "discord.js";
import { SubscriptionTierKey, subscriptionTiers } from "@structs/access/subscription";
import { formatSubscriptions } from "../_lib/formatSubscription";
import { updateSubscription } from "../_lib/updateSubscription";

export default SubCommand(

  // Info
  {
    name: "add",
    description: "Add a guild to your subscription",

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "guild_id",
        description: "The ID of the guild you want to add",
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
    else guild = await state.client.guilds.fetch(guildId).catch(() => null);

    if (!guild)
      return { embeds: [warningEmbedTemplate("Sorry, I couldn't find that guild, are you sure the ID is correct and i am also in that server?")] };

    // Check if user has a subscription
    const user = await state.db.user.findFirst({
      where: { id: msg.user.id, NOT: { subscriptionTier: null } },
      include: { subscribedGuilds: true },
    });

    if (!user) return { embeds: [warningEmbedTemplate("You do not currently have a subscription.")] };

    // Check if user is already subscribed to that guild
    const guildAlreadySubscribed = user.subscribedGuilds.find((subscribedGuild) => subscribedGuild.id === guild?.id);
    if (guildAlreadySubscribed) return { embeds: [warningEmbedTemplate("You are already subscribed to that guild.")] };

    // Check if guild is already subscribed to by another user
    const alreadyTaken = await state.db.guild.findFirst({ where: { id: guild.id, NOT: [{ subscribedUserId: null }] } });
    if (alreadyTaken) return { embeds: [warningEmbedTemplate("That guild is already subscribed to by another user.")] };

    // Check if user has reached the guild limit
    const subscription = subscriptionTiers[user.subscriptionTier as SubscriptionTierKey];
    if (user.subscribedGuilds.length >= subscription.guildLimit)
      return { embeds: [warningEmbedTemplate(`You have reached the maximum number of guilds you can subscribe to with your current subscription tier, which is  \`${subscription.guildLimit}\``)] };

    // Add guild to user's subscriptions
    const addedGuild = await updateSubscription(guild.id, user.id, user.subscriptionTier);
    user.subscribedGuilds.push(addedGuild);

    // Send success message
    const embed = embedTemplate();
    embed.setTitle("Subscription");
    embed.setDescription(`You have successfully subscribed to "**${guild?.name}**".`);
    formatSubscriptions(embed, user, subscription);

    return { embeds: [embed] };

  }
);
