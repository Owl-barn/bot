import { embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { friendships } from "@prisma/client";
import { state } from "@app";
import { PermissionFlagsBits } from "discord-api-types/payloads/v9";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js";
import { localState as VCState } from "modules/private-room";

export class Controller {
  private timeout: Map<string, NodeJS.Timeout> = new Map();
  private lastNotified: Map<string, number> = new Map();

  public onChange = async (oldState: VoiceState, newState: VoiceState) => {
    const db = state.db;

    const channelUnchanged = oldState.channel?.id === newState.channel?.id;
    const member = newState.member;
    // Check if joined vc.
    if (!member) return;
    if (channelUnchanged) return;
    if (newState.channel === null) return;

    // Check if timed out.
    const lastNotify = this.lastNotified.get(member.id);
    if (lastNotify) {
      if (lastNotify + state.env.VOICE_NOTIFY_DELAY * 60 * 1000 > Date.now()) return;
      else this.lastNotified.delete(member.id);
    }

    // Check if channel is a waiting room.
    const isWaitingRoom = VCState.controller
      .getRooms()
      .find(r => r.wait_channel_id === newState.channel?.id);

    if (isWaitingRoom) return;

    // Check if has friends.
    const friends = await db.friendships.findMany({
      where: { friend_id: newState.member.id },
    });

    if (friends.length === 0) return;

    // Clear timeout if present.
    const hasTimeout = this.timeout.get(newState.member.id);
    if (hasTimeout !== undefined) {
      clearTimeout(hasTimeout);
    }

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
        state.env.VOICE_NOTIFY_TIMEOUT * 60 * 1000,
      ),
    );
  };

  private checkIfNotify = async (
    member_id: string,
    channel: VoiceBasedChannel,
    friends: friendships[],
  ) => {
    this.timeout.delete(member_id);
    if (!channel) return;
    const member = await channel.guild.members.fetch(member_id);
    if (!member) return;
    if (!member.voice.channel) return;
    if (member.voice.channel.id !== channel.id) return;
    await this.notifyUsers(member, friends).catch(console.error);
  };

  private notifyUsers = async (
    member: GuildMember,
    friends: friendships[],
  ) => {
    const channel = member.voice.channel;
    const guild = await member.client.guilds.fetch(member.guild.id);
    if (channel === null) return;

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

      const isPrivateRoom = VCState.controller.getRooms().find((r) => r.main_channel_id === channel.id);

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
