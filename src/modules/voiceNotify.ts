import { friendships } from "@prisma/client";
import { PermissionFlagsBits } from "discord-api-types/payloads/v9";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    GuildMember,
    VoiceBasedChannel,
    VoiceState,
} from "discord.js";
import { embedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import RavenClient from "../types/ravenClient";
import env from "./env";

class VoiceNotify {
    private timeout: Map<string, NodeJS.Timeout> = new Map();
    private lastNotified: Map<string, number> = new Map();

    public onChange = async (oldState: VoiceState, newState: VoiceState) => {
        const db = (oldState.client as RavenClient).db;

        const channelUnchanged = oldState.channel?.id === newState.channel?.id;
        const member = newState.member;
        // Check if joined vc.
        if (!member) return;
        if (channelUnchanged) return;
        if (!newState.channel) return;

        // Check if timed out.
        const lastNotify = this.lastNotified.get(member.id);
        if (lastNotify) {
            if (lastNotify + env.VOICE_NOTIFY_DELAY * 60 * 1000 > Date.now()) {
                return;
            } else {
                this.lastNotified.delete(member.id);
            }
        }

        // Check if channel is a waiting room.
        const guildConfig = GuildConfig.getGuild(newState.channel.id);
        const isWaitingRoom = guildConfig?.privateRooms.find(
            (r) => r.wait_channel_id === newState.channel?.id,
        );
        if (isWaitingRoom) return;

        // Check if has friends.
        const friends = await db.friendships.findMany({
            where: { friend_id: newState.member.id },
        });

        if (friends.length === 0) return;

        // Iniate the timeout.
        this.timeout.set(
            newState.member.id,
            setTimeout(
                async () =>
                    await this.checkIfNotify(
                        member.id,
                        newState.channel as VoiceBasedChannel,
                        friends,
                    ),
                env.VOICE_NOTIFY_TIMEOUT * 60 * 1000,
            ),
        );
    };

    private checkIfNotify = async (
        member_id: string,
        channel: VoiceBasedChannel,
        friends: friendships[],
    ) => {
        this.timeout.delete(member_id);
        const member = await channel.guild.members.fetch(member_id);
        if (!member) return;
        if (!member.voice.channel) return;
        if (member.voice.channel.id !== channel.id) return;
        await this.notifyUsers(member, friends).catch((e) => {
            console.error(e);
            return;
        });
    };

    private notifyUsers = async (
        member: GuildMember,
        friends: friendships[],
    ) => {
        const channel = member.voice.channel;
        const guild = await member.client.guilds.fetch(member.guild.id);
        if (channel === null) return;
        const guildConfig = GuildConfig.getGuild(guild.id);

        // Make embed.
        const embed = embedTemplate();
        embed.setTitle("Your friend is in a voice channel!");
        embed.setDescription(
            `<@${member.id}> joined <#${channel.id}> in \`${channel.guild.name}\`\n\n[Click here to join them!](${channel.url})`,
        );
        const avatar = getAvatar(member);
        if (avatar) embed.setThumbnail(avatar);

        // Fetch member objects.
        const friendMembers = await guild.members.fetch({
            user: friends.map((f) => f.user_id),
        });

        // Loop through friends.
        const notifyQueue: Promise<unknown>[] = [];
        friendMembers.forEach((friend) => {
            if (friend.voice.channel) return;
            // Check if vc is joinable and not a private room.
            const canJoin = channel
                .permissionsFor(friend)
                .has(
                    PermissionFlagsBits.ViewChannel |
                        PermissionFlagsBits.Connect,
                );
            const isPrivateRoom = guildConfig?.privateRooms.find(
                (r) => r.main_channel_id === channel.id,
            );

            if (!canJoin && !isPrivateRoom) return;

            // Add delete button.
            const component =
                new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;

            component.addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_${friend.id}`)
                    .setLabel("Delete")
                    .setStyle(ButtonStyle.Danger),
            );

            // Add message to queue.
            notifyQueue.push(
                friend.send({ embeds: [embed], components: [component] }),
            );

            console.log(`Notifying ${friend.user.tag} for ${member.user.tag}`);
        });

        await Promise.all(notifyQueue);

        this.lastNotified.set(member.id, Date.now());
    };
}

declare const global: NodeJS.Global & { voiceNotify: VoiceNotify };
const voiceNotify: VoiceNotify = global.voiceNotify || new VoiceNotify();
if (env.isDevelopment) global.voiceNotify = voiceNotify;

export default voiceNotify;
