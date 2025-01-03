import { ButtonBuilder } from "@discordjs/builders";
import { Event } from "@structs/event";
import {
  ActionRowBuilder,
  ButtonStyle,
  NonThreadGuildBasedChannel,
} from "discord.js";
import { state } from "@app";
import { embedTemplate } from "@lib/embedTemplate";
import { localState } from "..";
import { getOrCreateGuild } from "@lib/guild";

export default Event({
  name: "guildCreate",
  once: false,
  ignoreBans: true,

  async execute(guild) {
    try {
      if (!guild) throw "failed to register guild";

      localState.log.info(`Joined new guild, Id: ${guild.id} Owner: ${guild.ownerId} Name: ${guild.name}`.red.bold);


      // Notify bot owner.
      const notifEmbed = embedTemplate(
        `Name: ${guild.name}\nID: ${guild.id}\nOwner: ${guild.ownerId}\nMembercount: ${guild.memberCount}`,
      );
      notifEmbed.setTitle("New guild");

      const owner = await guild.client.users.fetch(state.env.OWNER_ID);

      await owner.send({ embeds: [notifEmbed] }).catch(() => null);

      await getOrCreateGuild(guild);

      // Return if banned
      const config = state.guilds.get(guild.id);
      if (config?.isBanned) return;

      // Attempt to find a welcome channel.
      let channel: NonThreadGuildBasedChannel | null =
        guild.systemChannel ??
        guild.publicUpdatesChannel ??
        guild.widgetChannel;

      // Find first text channel with write perms.
      if (!channel) {
        const channels = await guild.channels.fetch().catch(() => null);
        channels?.forEach((currentChannel) => {
          if (!currentChannel) return;
          if (!channel) return;
          if (!channel.isTextBased()) return;
          if (!channel.guild.members.me) return;
          const hasPerms = currentChannel
            .permissionsFor(channel.guild.members.me)
            .has("SendMessages");
          if (!hasPerms) return;

          channel = currentChannel;
        });
      }

      if (!channel || !channel.isTextBased()) return;

      // Inform guild.
      const embed = embedTemplate()
        .setTitle("Thank you!")
        .setDescription(
          `Thank you for inviting me! ${state.env.SUPPORT_SERVER !== undefined ? "For any questions we are happy to help you out in our server!" : ""}`,
        )
        .setThumbnail(
          guild.client.user?.avatarURL() ||
          (guild.client.user?.defaultAvatarURL as string),
        )
        .setTimestamp();

      const buttons: ButtonBuilder[] = [];

      if (state.env.DONATION_URL) {
        buttons.push(
          new ButtonBuilder()
            .setLabel("Donation")
            .setStyle(ButtonStyle.Link)
            .setURL(state.env.DONATION_URL)
        );
      }

      if (state.env.SUPPORT_SERVER) {
        buttons.push(
          new ButtonBuilder()
            .setLabel("Discord")
            .setStyle(ButtonStyle.Link)
            .setURL(state.env.SUPPORT_SERVER)
        );
      }

      const components = state.env.DONATION_URL && state.env.SUPPORT_SERVER
        ? [new ActionRowBuilder().setComponents(buttons) as ActionRowBuilder<ButtonBuilder>]
        : [];

      await channel
        .send({ embeds: [embed], components })
        .catch(() =>
          localState.log.warn(`couldn't send message in new server. (${guild.id})`),
        );
    } catch (e) {
      localState.log.error(e);
    }
  },
});
