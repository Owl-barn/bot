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
  Client,
} from "discord.js";
import { getAvatar, randomRange } from "../../../lib/functions";
import { embedTemplate } from "../../../lib/embedTemplate";
import path from "path";
import fs from "fs";
import moment from "moment";
import { state } from "@app";
import { localState as owletState } from "../../owlet";
import { logType } from "@lib/services/logService";
import { Guild, PrivateRoom } from "@prisma/client";

const db = state.db;

interface RoomNames {
  adjectives: string[];
  nouns: string[];
}

export class Controller {
  private createRateLimit: Set<string> = new Set();
  private notifyRatelimit: Set<string> = new Set();
  private deleteTimeout: Map<string, NodeJS.Timeout> = new Map();

  private adjectives: string[] = [];
  private nouns: string[] = [];

  public rooms: PrivateRoom[] = [];

  public initialize = async (client: Client) => {
    const rooms = await db.privateRoom.findMany();
    const guilds = await db.guild.findMany();

    // Try to load the room names from the file.
    try {
      const buffer = fs.readFileSync(
        path.join(__dirname, "..", "roomNames.json"),
        "utf8",
      );

      const roomNames = JSON.parse(buffer.toString()) as
        | RoomNames
        | undefined;

      if (!roomNames) throw " ✘ No roomNames found.";
      if (roomNames.adjectives.length == 0)
        throw " ✘ No adjectives found.";

      if (roomNames.nouns.length == 0) throw " ✘ No nouns found.";

      this.adjectives = roomNames.adjectives;
      this.nouns = roomNames.nouns;
    } catch (e) {
      if (typeof e === "string") console.error(e.yellow.bold);
      else console.error(" ✘ No roomNames.json found.".yellow.bold);
      // Generic names
      this.adjectives = ["Private", "Secret", "Hidden", "Secret"];
      this.nouns = ["Room", "Basement", "Attic", "Chambers"];
    }

    // Remove all empty rooms.
    for (const room of rooms) {
      const guild = await client.guilds
        .fetch(room.guildId)
        .catch(() => null);

      console.log(` - ${room.guildId} ${guild != null}`.blue.bold);

      if (guild === null) {
        await db.privateRoom.deleteMany({
          where: { guildId: room.guildId },
        });
        continue;
      }

      const channelMembers: UserResolvable[] = [];

      let mainRoom = (await guild.channels
        .fetch(room.mainRoomId)
        .catch(() => null)) as VoiceChannel | null;

      const waitRoom = (await guild.channels
        .fetch(room.waitingRoomId)
        .catch(() => null)) as VoiceChannel | null;

      console.log(
        `  - main: ${room.mainRoomId} - ${mainRoom != null}`.cyan
          .italic,
      );

      // Main room exists
      if (mainRoom !== null) {
        // Fetch all members in the main room.
        mainRoom.permissionOverwrites.cache.map((x) => {
          if (x.type == OverwriteType.Role) return;
          channelMembers.push(x.id);
        });

        await guild.members
          .fetch({ user: channelMembers })
          .catch(() => null);

        mainRoom = (await guild.channels
          .fetch(room.mainRoomId)
          .catch(() => null)) as VoiceChannel | null;

        mainRoom
          ? console.log(
            `  - members: ${mainRoom.members.size}`.cyan.italic,
          )
          : null;
      }

      console.log(
        `  - wait: ${room.waitingRoomId} - ${waitRoom != null}`.cyan
          .italic,
      );

      if (!mainRoom && !waitRoom) {
        await db.privateRoom.delete({
          where: { mainRoomId: room.mainRoomId },
        });
        continue;
      }

      if (!mainRoom || mainRoom.members.size == 0) {
        await db.privateRoom.delete({
          where: { mainRoomId: room.mainRoomId },
        });

        mainRoom?.deletable ? await mainRoom.delete() : null;
        waitRoom?.deletable ? await waitRoom.delete() : null;

        continue;
      }
    }

    // Load all the configs.
    guilds.forEach(this.updateConfig);

    // Load all the rooms.
    const loadedRooms = await db.privateRoom.findMany();
    for (const room of loadedRooms) this.upsertRoom(room);

    console.log(
      " ✓ Loaded VC service with ".green.bold +
      this.adjectives.length.toString().cyan +
      " adjectives and ".green.bold +
      this.nouns.length.toString().cyan +
      " nouns.".green.bold,
    );
  }

  public updateConfig = (guild: Guild) => {
    state.guilds.set(guild.id, guild);
  }

  public upsertRoom = (room: PrivateRoom) => {
    const index = this.rooms.findIndex((x) => x.mainRoomId == room.mainRoomId);
    if (index == -1) this.rooms.push(room);
    else this.rooms[index] = room;
  }

  public deleteRoom = (room: PrivateRoom) => {
    this.rooms = this.rooms.filter((x) => x.mainRoomId != room.mainRoomId);
  }

  public getRooms = () => {
    return [...this.rooms];
  }

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

    // Left a private room.
    if (
      old.channelId &&
      rooms?.find((x) => x.mainRoomId == old.channelId)
    ) {
      this.leaveHub(old).catch(console.error);
    }

    if (current.channelId) {
      // User joined the main room.
      if (guildConfig?.privateRoomChannelId == current.channelId) {
        this.createHub(current).catch(console.error);
      }

      // User joined a private room.
      if (rooms?.find((x) => x.mainRoomId == current.channelId)) {
        this.joinHub(current).catch(console.error);
      }
      // User joined waiting room.
      const waitJoin = rooms?.find(
        (x) => x.waitingRoomId == current.channelId,
      );
      if (waitJoin) {
        this.joinWaiting(current, waitJoin).catch((e) =>
          console.error(e),
        );
      }
    }
  }

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
      .send(
        `Hey <@${room.userId}>, ${member.displayName} has joined the waiting room.`,
      )
      .catch(console.error);

    this.notifyRatelimit.add(member.id);
    setTimeout(() => this.notifyRatelimit.delete(member.id), 180000);
  }

  private getGuildRooms = (guildId: string) => {
    return this.rooms.filter((x) => x.guildId == guildId);
  }

  private startDelete = (
    vc: VoiceBasedChannel,
    duration: number,
    reason: string,
  ) => {
    this.deleteTimeout.set(
      vc.id,
      setTimeout(() => this.disbandVC(vc, reason), duration * 1000),
    );
  }

  private cancelDelete = (vc: VoiceBasedChannel) => {
    const timeout = this.deleteTimeout.get(vc.id);
    if (timeout) clearTimeout(timeout);
    this.deleteTimeout.delete(vc.id);
  }

  private leaveHub = async (vc: VoiceState) => {
    if (!vc.channel) return;
    const memberCount = this.getMemberCount(vc);

    // If the member count is 0 or 1, start the delete room timeout.
    if (memberCount == 0)
      this.startDelete(
        vc.channel,
        state.env.ABANDON_TIMEOUT * 60,
        "The room was abandoned for too long.",
      );
    else if (memberCount == 1) {
      this.startDelete(
        vc.channel,
        state.env.ALONE_TIMEOUT * 60,
        "User was alone in vc for too long.",
      );
    }
  }

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
  }

  private createHub = async (vc: VoiceState) => {
    const member = vc.member as GuildMember;

    if (this.createRateLimit.has(member.id) && member.id !== state.env.OWNER_ID)
      return;

    const guildConfig = state.guilds.get(vc.guild.id);
    if (!guildConfig) return;

    const rooms = this.getGuildRooms(vc.guild.id);

    if (rooms.length > 0) {
      // Already has a vc.
      if (rooms.find((x) => x.userId == member.id)) return;
      // Limit reached.
      if (rooms.length >= guildConfig.privateRoomLimit) {
        const dm = await member.createDM();
        await dm
          .send(
            "Sorry the maximum number of private rooms are used in this server, Please try again later.. 🦉",
          )
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
    const roomInfo = await db.privateRoom.create({
      data: {
        userId: member.id,
        guildId: vc.guild.id,
        mainRoomId: room.id,
        waitingRoomId: wait.id,
      },
    });

    rooms.push(roomInfo);

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
      state.env.ALONE_TIMEOUT * 60,
      `Nobody joined <@${member.id}>'s room.`,
    );

    // Log event.
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

    state.log.push(embed, vc.guild.id, logType.BOT);
  }

  public disbandVC = async (
    vc: VoiceBasedChannel,
    reason: string | null = null,
  ) => {
    this.cancelDelete(vc);

    const query = await db.privateRoom.findUnique({
      where: { mainRoomId: vc.id },
    });
    if (!query) return;

    this.createRateLimit.add(query.userId);
    setTimeout(() => this.createRateLimit.delete(query.userId), 180000);

    // Fetch rooms.
    const mainRoom = (await vc.guild.channels
      .fetch(query.mainRoomId)
      .catch(console.error)) as VoiceChannel;

    const WaitRoom = (await vc.guild.channels
      .fetch(query.waitingRoomId)
      .catch(console.error)) as VoiceChannel;

    // Attempt to delete rooms.
    if (mainRoom)
      mainRoom.deletable
        ? await mainRoom
          .delete("Session expired")
          .catch(console.error)
        : console.error(`Couldnt delete ${mainRoom.id}`.red);
    if (WaitRoom)
      WaitRoom.deletable
        ? await WaitRoom.delete("Session expired").catch(console.error)
        : console.error(`Couldnt delete ${WaitRoom.id}`.red);

    // Remove from db.
    const roomInfo = await db.privateRoom.delete({ where: { mainRoomId: vc.id } });

    this.deleteRoom(roomInfo);

    // Log event.
    const embed = embedTemplate();
    embed.setTitle("Private Room Disbanded");

    // How long the room was active for.
    const lifespan = moment
      .utc(moment(Date.now()).diff(mainRoom?.createdAt))
      .format("HH:mm:ss");

    // Users that joined the room.
    const users = mainRoom?.permissionOverwrites.cache
      .filter(
        (x) =>
          !owletState.controller.getBotIds().includes(x.id) &&
          x.type === OverwriteType.Member,
      )
      .map((x) => `<@${x.id}>`)
      .join(", ");

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
    state.log.push(embed, vc.guild.id, logType.BOT);
  }

  private getMemberCount = (vc: VoiceState) => {
    if (!vc.channel) return 0;
    const members = vc.channel.members.filter((x) => !x.user.bot);
    return members.size;
  }
}
