import {
  GuildMember,
  OverwriteResolvable,
  OverwriteType,
  PermissionFlagsBits,
  VoiceChannel,
  VoiceState,
  UserResolvable,
  ChannelType,
  VoiceBasedChannel,
} from "discord.js";
import { getAvatar, randomRange } from "../../../lib/functions";
import { embedTemplate } from "../../../lib/embedTemplate";
import path from "path";
import fs from "fs";
import { state } from "@app";
import { localState as owletState } from "../../owlet";
import { logType } from "@lib/services/logService";
import { PrivateRoom } from "@prisma/client";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { localState } from "..";
import { DateTime } from "luxon";

interface RoomNames {
  adjectives?: string[];
  nouns?: string[];
}

export class Controller {
  private createRateLimit: Set<string> = new Set();
  private notifyRatelimit: Set<string> = new Set();
  private deleteTimeout: Map<string, NodeJS.Timeout> = new Map();

  private adjectives = ["Private", "Secret", "Hidden", "Secret"];
  private nouns = ["Room", "Basement", "Attic", "Chambers"];

  public rooms: PrivateRoom[] = [];

  public initialize = async () => {
    // Try to load the room names from the file.
    await this.loadRoomNames();

    // Remove all empty rooms.
    await this.purgeEmptyRooms();


    // Load all the rooms.
    const loadedRooms = await state.db.privateRoom.findMany();
    for (const room of loadedRooms) this.upsertRoom(room);

    console.log(
      " - Loaded VC service with ".green +
      this.adjectives.length.toString().cyan +
      " adjectives and ".green +
      this.nouns.length.toString().cyan +
      " nouns.".green,
    );
  };

  private loadRoomNames = async () => {
    // Load the room names from the file.
    let buffer;
    try {
      buffer = fs.readFileSync(path.join(process.cwd(), "config", "roomNames.json"), "utf8");
    } catch (error) {
      localState.log.warn("Failed to find/open roomNames.json", { error });
      return;
    }

    // Parse the room names.
    let data: RoomNames;
    try {
      data = JSON.parse(buffer.toString());
    } catch (error) {
      localState.log.error("Failed to parse roomNames.json", { error });
      return;
    }

    // Check if the data is valid.
    if (
      (!data.adjectives || data.adjectives.length < 1) ||
      (!data.nouns || data.nouns.length < 1)
    ) {
      localState.log.error("Invalid roomNames.json", { data });
      return;
    }

    // Set the room names.
    this.adjectives = data.adjectives;
    this.nouns = data.nouns;

    localState.log.debug("Loaded room names.", { data });
  };

  private purgeEmptyRooms = async () => {
    const rooms = await state.db.privateRoom.findMany();

    for (const room of rooms) {
      const guild = await state.client.guilds
        .fetch(room.guildId)
        .catch(() => null);

      if (guild === null) {
        await state.db.privateRoom.deleteMany({
          where: { guildId: room.guildId },
        });
        continue;
      }

      const channelMembers: UserResolvable[] = [];

      // Fetch the main room.
      let mainRoom = (await guild.channels
        .fetch(room.mainRoomId)
        .catch(() => null)) as VoiceChannel | null;

      // Fetch the waiting room.
      const waitRoom = (await guild.channels
        .fetch(room.waitingRoomId)
        .catch(() => null)) as VoiceChannel | null;

      // Main room exists
      if (mainRoom !== null) {
        // Fetch all members in the main room.
        mainRoom.permissionOverwrites.cache.map((x) => {
          if (x.type == OverwriteType.Role) return;
          channelMembers.push(x.id);
        });

        // Fetch all members that have been in the main room.
        await guild.members
          .fetch({ user: channelMembers })
          .catch(() => null);

        mainRoom = (await guild.channels
          .fetch(room.mainRoomId)
          .catch(() => null)) as VoiceChannel | null;
      }


      // Delete the db entry.
      await state.db.privateRoom.delete({
        where: { mainRoomId: room.mainRoomId },
      });

      // If both rooms already dont exist, return.
      if (!mainRoom && !waitRoom) continue;

      // If the main room doesnt exist or is empty, but the waiting room does, delete.
      if (!mainRoom || mainRoom.members.size == 0) {
        mainRoom?.deletable && await mainRoom.delete();
        waitRoom?.deletable && await waitRoom.delete();
      }
    }
  };

  public upsertRoom = (room: PrivateRoom) => {
    const index = this.rooms.findIndex((x) => x.mainRoomId == room.mainRoomId);
    if (index == -1) this.rooms.push(room);
    else this.rooms[index] = room;
  };

  public deleteRoom = (room: PrivateRoom) => {
    this.rooms = this.rooms.filter((x) => x.mainRoomId != room.mainRoomId);
  };

  public getRooms = () => {
    return [...this.rooms];
  };

  public onChange = async (old: VoiceState, current: VoiceState) => {
    const member = current.member;
    const me = current.guild.members.me;

    if (!me) return;
    if (
      !me.permissions.has(PermissionFlagsBits.ManageChannels) ||
      !me.permissions.has(PermissionFlagsBits.MoveMembers)
    )
      return;

    if (!member) return;
    if (member.user.bot) return;

    const guildConfig = state.guilds.get(current.guild.id);
    const rooms = this.getGuildRooms(current.guild.id);

    // Didnt join/leave.
    if (old.channelId == current.channelId) return;

    const errorUser = `${member.user.tag.green} <@${member.user.id.cyan}>`;

    // Left a private room.
    if (old.channelId && rooms?.find((x) => x.mainRoomId == old.channelId)) {
      this
        .leaveHub(old)
        .catch(error => localState.log.error(`Failed to run leaveHub for ${errorUser}`, { error }));
    }

    if (current.channelId) {
      // User joined the main room.
      if (guildConfig?.privateRoomChannelId == current.channelId)
        this
          .createHub(current)
          .catch(error => localState.log.error(`Failed to run createHub for ${errorUser}`, { error }));

      // User joined a private room.
      if (rooms?.find((x) => x.mainRoomId == current.channelId)) {
        this
          .joinHub(current)
          .catch(error => localState.log.error(`Failed to run joinHub for ${errorUser}`, { error }));
      }
      // User joined waiting room.
      const waitJoin = rooms?.find(
        (x) => x.waitingRoomId == current.channelId,
      );
      if (waitJoin) {
        this
          .joinWaiting(current, waitJoin)
          .catch(error => localState.log.error(`Failed to run joinWaiting for ${errorUser}`, { error }));
      }
    }
  };

  private joinWaiting = async (vc: VoiceState, room: PrivateRoom) => {
    const member = vc.member as GuildMember;
    if (this.notifyRatelimit.has(member.id)) return;

    const mainRoom = (await vc.guild.channels.fetch(
      room.mainRoomId,
    )) as VoiceChannel;
    if (!mainRoom) return;

    if (mainRoom.permissionOverwrites.cache.get(member.id)) return;
    if (!mainRoom.isTextBased()) return;

    await mainRoom
      .send(`Hey <@${room.userId}>, ${member.displayName} has joined the waiting room.`)
      .catch(error => localState.log.warn(`Failed to send notification message to ${mainRoom.name}`, { error }));

    this.notifyRatelimit.add(member.id);
    setTimeout(() => this.notifyRatelimit.delete(member.id), 180000);
  };

  private getGuildRooms = (guildId: string) => {
    return this.rooms.filter((x) => x.guildId == guildId);
  };

  private startDelete = (
    vc: VoiceBasedChannel,
    duration: number,
    reason: string,
  ) => {
    this.deleteTimeout.set(
      vc.id,
      setTimeout(() => this.disbandVC(vc, reason), duration * 1000),
    );
  };

  private cancelDelete = (vc: VoiceBasedChannel) => {
    const timeout = this.deleteTimeout.get(vc.id);
    if (timeout) clearTimeout(timeout);
    this.deleteTimeout.delete(vc.id);
  };

  private leaveHub = async (vc: VoiceState) => {
    if (!vc.channel) return;
    const memberCount = this.getMemberCount(vc);

    // If the member count is 0 or 1, start the delete room timeout.
    if (memberCount == 0)
      this.startDelete(
        vc.channel,
        state.env.ROOM_ABANDON_TIMEOUT,
        "The room was abandoned for too long.",
      );
    else if (memberCount == 1) {
      this.startDelete(
        vc.channel,
        state.env.ROOM_ALONE_TIMEOUT,
        "User was alone in vc for too long.",
      );
    }
  };

  private joinHub = async (vc: VoiceState) => {
    const member = vc.member as GuildMember;
    if (!vc.channel) return;

    // Remove timeout if exists.
    const memberCount = this.getMemberCount(vc);
    if (memberCount > 1) this.cancelDelete(vc.channel);

    // Add join perms if not already have.
    if (vc.channel.permissionOverwrites.cache.get(member.id)) return;
    vc.channel.permissionOverwrites.create(member.id, {
      Connect: true,
      ViewChannel: true,
    });
  };

  private createHub = async (vc: VoiceState) => {
    const member = vc.member as GuildMember;

    if (this.createRateLimit.has(member.id) && member.id !== state.env.OWNER_ID)
      return;

    const guildConfig = state.guilds.get(vc.guild.id);
    if (!guildConfig) return;

    const guildRooms = this.getGuildRooms(vc.guild.id);

    if (guildRooms.length > 0) {
      // Already has a vc.
      if (guildRooms.find((x) => x.userId == member.id)) return;
      // Limit reached.
      if (guildRooms.length >= guildConfig.privateRoomLimit) {
        const dm = await member.createDM();
        await dm
          .send("Sorry the maximum number of private rooms are used in this server, Please try again later.. 🦉")
          .catch(null);
        return;
      }
    }

    const owletsPerms: OverwriteResolvable[] = [];
    const botIds = owletState.controller.getBotIds();

    for (const owlet of botIds) {
      const botPerms: OverwriteResolvable = {
        id: owlet,
        type: OverwriteType.Member,
        allow:
          PermissionFlagsBits.ManageChannels |
          PermissionFlagsBits.ViewChannel |
          PermissionFlagsBits.Connect |
          PermissionFlagsBits.Speak,
        // allow: ["ManageChannels", "ViewChannel", "Connect", "Speak"],
      };

      owletsPerms.push(botPerms);
    }

    // Channel perms.
    const ownerPerms: OverwriteResolvable = {
      id: member.id as string,
      allow:
        PermissionFlagsBits.MoveMembers |
        PermissionFlagsBits.Connect |
        PermissionFlagsBits.ViewChannel,
    };

    const mainPerms: OverwriteResolvable = {
      id: vc.guild.id,
      deny: PermissionFlagsBits.Connect,
      allow: PermissionFlagsBits.Speak | PermissionFlagsBits.Stream,
    };

    const waitingPerms: OverwriteResolvable = {
      id: vc.guild.id,
      deny:
        PermissionFlagsBits.Speak |
        PermissionFlagsBits.Stream |
        PermissionFlagsBits.AttachFiles |
        PermissionFlagsBits.EmbedLinks,
    };

    const staffPerms: OverwriteResolvable = {
      id: guildConfig.staffRoleId || "",
      allow: PermissionFlagsBits.ViewChannel,
    };

    // Generate channel name.
    const random1 = randomRange(0, this.adjectives.length);
    const random2 = randomRange(0, this.nouns.length);
    const channelName = this.adjectives[random1] + this.nouns[random2];

    const roomList = [ownerPerms, mainPerms].concat(owletsPerms);
    const waitList = [ownerPerms, waitingPerms].concat(owletsPerms);

    if (guildConfig.staffRoleId) {
      roomList.push(staffPerms);
      waitList.push(staffPerms);
    }

    // Create rooms.
    const room = await vc.guild.channels.create({
      type: ChannelType.GuildVoice,
      name: `🔒 ${channelName} VC`,
      permissionOverwrites: roomList,
      parent: guildConfig.privateRoomCategoryId as string,
    });

    const wait = await vc.guild.channels.create({
      type: ChannelType.GuildVoice,
      permissionOverwrites: waitList,
      name: `🕐 ${channelName} Waiting Room`,
      parent: guildConfig.privateRoomCategoryId as string,
    });

    // Put into db and update local config.
    const roomInfo = await state.db.privateRoom.create({
      data: {
        mainRoomId: room.id,
        waitingRoomId: wait.id,
        user: connectOrCreate(member.id),
        guild: connectOrCreate(vc.guild.id),
      },
    });

    this.rooms.push(roomInfo);

    // Move user.
    const moved = await member.voice
      .setChannel(room.id, "Created private room")
      .catch(() => null);

    if (!moved) {
      await room.delete().catch(() => null);
      await wait.delete().catch(() => null);
      return;
    }

    this.startDelete(
      room,
      state.env.ROOM_ALONE_TIMEOUT,
      `Nobody joined <@${member.id}>'s room.`,
    );

    // Log event.
    localState.log.info(`Created private room <#${room.id.cyan}> (${room.name.green}) for <@${member.user.id.cyan}>`);
    const embed = embedTemplate();
    embed.setTitle("Private Room Created");
    embed.addFields([
      {
        name: "Name",
        value: `🔒 ${channelName} VC\n<#${room.id}>`,
        inline: true,
      },
      {
        name: "Created",
        value: `<t:${Math.round(Date.now() / 1000)}:R>`,
        inline: true,
      },
    ]);
    embed.setFooter({
      text: `${member.user.tag} <@${member.id}>`,
      iconURL: getAvatar(member),
    });

    state.botLog.push(embed, vc.guild.id, logType.BOT);
  };

  private deleteChannel = async (room: VoiceBasedChannel) => {
    room.deletable
      ? await room
        .delete("Session expired")
        .catch(error => localState.log.error(`Room <#${room.id.cyan}> failed to delete`, { error }))
      : localState.log.error(`Room <#${room.id.cyan}> is not deletable.`);
  };

  public disbandVC = async (
    vc: VoiceBasedChannel,
    reason: string | null = null,
  ) => {
    this.cancelDelete(vc);

    const query = await state.db.privateRoom.findUnique({
      where: { mainRoomId: vc.id },
    });
    if (!query) return;

    this.createRateLimit.add(query.userId);
    setTimeout(() => this.createRateLimit.delete(query.userId), 180000);

    // Fetch rooms.
    const mainRoom = (await vc.guild.channels
      .fetch(query.mainRoomId)
      .catch(error => { localState.log.warn(`Room <#${query.mainRoomId.cyan}> failed to fetch`, { error }); }));

    const WaitRoom = (await vc.guild.channels
      .fetch(query.waitingRoomId)
      .catch(error => { localState.log.warn(`Room <#${query.waitingRoomId.cyan}> failed to fetch`, { error }); }));

    // Remove from state.db.
    const roomInfo = await state.db.privateRoom.delete({ where: { mainRoomId: vc.id } });
    this.deleteRoom(roomInfo);

    // Attempt to delete rooms.
    if (mainRoom && mainRoom.isVoiceBased()) await this.deleteChannel(mainRoom);
    if (WaitRoom && WaitRoom.isVoiceBased()) await this.deleteChannel(WaitRoom);


    // Log event.
    const embed = embedTemplate();
    embed.setTitle("Private Room Disbanded");

    // How long the room was active for.
    const lifespan = mainRoom?.createdAt ?
      DateTime.now()
        .diff(DateTime.fromJSDate(mainRoom?.createdAt))
        .toFormat("h:mm:ss")
      : "Unknown";

    // Users that joined the room.
    const users = mainRoom?.isVoiceBased() ? mainRoom.permissionOverwrites.cache
      .filter(
        (x) =>
          !owletState.controller.getBotIds().includes(x.id) &&
          x.type === OverwriteType.Member,
      )
      .map((x) => `<@${x.id}>`)
      .join(", ")
      : null;

    embed.addFields([
      {
        name: "Name",
        value: mainRoom?.name || "Unknown name",
        inline: true,
      },
      {
        name: "Duration",
        value: lifespan,
        inline: true,
      },
      {
        name: "Reason",
        value: reason || "No reason provided",
        inline: true,
      },
      {
        name: "Users",
        value: users ?? "Error fetching users.",
        inline: false,
      },
    ]);

    localState.log.info(`Deleted private room <#${mainRoom?.id.cyan}> (${mainRoom?.name.green})`);
    state.botLog.push(embed, vc.guild.id, logType.BOT);
  };

  private getMemberCount = (vc: VoiceState) => {
    if (!vc.channel) return 0;
    const members = vc.channel.members.filter((x) => !x.user.bot);
    return members.size;
  };
}
