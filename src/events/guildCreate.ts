import { ButtonBuilder } from "@discordjs/builders";
import {
    Guild,
    ActionRowBuilder,
    ButtonStyle,
    NonThreadGuildBasedChannel,
} from "discord.js";
import { embedTemplate } from "../lib/embedTemplate";
import GuildConfig from "../lib/guildconfig.service";
import registerCommand from "../modules/command.register";
import env from "../modules/env";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class implements RavenEvent {
    name = "guildCreate";
    once = false;

    async execute(guild: Guild): Promise<void> {
        try {
            if (!guild) throw "failed to register guild";
            if (GuildConfig.getGuild(guild.id)?.banned) return;

            console.log(
                `Joined new guild, Id: ${guild.id} Owner: ${guild.ownerId} Name: ${guild.name}`
                    .red.bold,
            );

            await registerCommand(guild.client as RavenClient, guild);

            // Notify bot owner.
            const notifEmbed = embedTemplate(
                `Name: ${guild.name}\nID: ${guild.id}\nOwner: ${guild.ownerId}\nMembercount: ${guild.memberCount}`,
            );
            notifEmbed.setTitle("New guild");

            const owner = await guild.client.users.fetch(env.OWNER_ID);

            await owner.send({ embeds: [notifEmbed] }).catch(() => null);

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
                    "Thank you for inviting me! For any questions we are happy to help you out in our server!",
                )
                .setThumbnail(
                    guild.client.user?.avatarURL() ||
                        (guild.client.user?.defaultAvatarURL as string),
                )
                .setTimestamp();

            const donateButton = new ButtonBuilder()
                .setLabel("Donation")
                .setStyle(ButtonStyle.Link)
                .setURL(env.DONATION_URL);

            const discordButton = new ButtonBuilder()
                .setLabel("Discord")
                .setStyle(ButtonStyle.Link)
                .setURL(env.SUPPORT_SERVER);

            const component = new ActionRowBuilder().setComponents([
                donateButton,
                discordButton,
            ]) as ActionRowBuilder<ButtonBuilder>;

            await channel
                .send({ embeds: [embed], components: [component] })
                .catch(() =>
                    console.log("Couldnt send message in new server."),
                );
        } catch (e) {
            console.error(e);
        }
    }
}
