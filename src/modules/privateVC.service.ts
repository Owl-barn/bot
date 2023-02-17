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
import RavenClient from "../types/ravenClient";
import db from "../lib/db.service";
import { getAvatar, randomRange } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import { private_vc } from "@prisma/client";
import logService, { logType } from "./logger.service";
import { embedTemplate } from "../lib/embedTemplate";
import env from "./env";
import path from "path";
import fs from "fs";
import moment from "moment";

interface RoomNames {
    adjectives: string[];
    nouns: string[];
}

class VCServiceClass {
    private createRateLimit: Set<string> = new Set();
    private notifyRatelimit: Set<string> = new Set();
    private deleteTimeout: Map<string, NodeJS.Timeout> = new Map();
    private adjectives: string[] = [];
    private nouns: string[] = [];

    public async initialize(client: RavenClient) {
        const rooms = await db.private_vc.findMany();

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

        for (const room of rooms) {
            const guild = await client.guilds
                .fetch(room.guild_id)
                .catch(() => null);

            console.log(` - ${room.guild_id} ${guild != null}`.blue.bold);

            if (guild == null) {
                await db.private_vc.deleteMany({
                    where: { guild_id: room.guild_id },
                });
                continue;
            }

            const channelMembers: UserResolvable[] = [];

            let mainRoom = (await guild.channels
                .fetch(room.main_channel_id)
                .catch(() => null)) as VoiceChannel | null;
            const waitRoom = (await guild.channels
                .fetch(room.wait_channel_id)
                .catch(() => null)) as VoiceChannel | null;

            console.log(
                `  - main: ${room.main_channel_id} - ${mainRoom != null}`.cyan
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
                    .fetch(room.main_channel_id)
                    .catch(() => null)) as VoiceChannel | null;

                mainRoom
                    ? console.log(
                          `  - members: ${mainRoom.members.size}`.cyan.italic,
                      )
                    : null;
            }

            console.log(
                `  - wait: ${room.wait_channel_id} - ${waitRoom != null}`.cyan
                    .italic,
            );

            if (!mainRoom && !waitRoom) {
                await db.private_vc.delete({
                    where: { main_channel_id: room.main_channel_id },
                });
                continue;
            }

            if (!mainRoom || mainRoom.members.size == 0) {
                await db.private_vc.delete({
                    where: { main_channel_id: room.main_channel_id },
                });

                mainRoom?.deletable ? await mainRoom.delete() : null;
                waitRoom?.deletable ? await waitRoom.delete() : null;

                continue;
            }
        }

        console.log(
            " ✓ Loaded VC service with ".green.bold +
                this.adjectives.length.toString().cyan +
                " adjectives and ".green.bold +
                this.nouns.length.toString().cyan +
                " nouns.".green.bold,
        );
    }

    public async onChange(old: VoiceState, current: VoiceState) {
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

        const guildConfig = GuildConfig.getGuild(current.guild.id);
        const rooms = guildConfig?.privateRooms;

        // Didnt join/leave.
        if (old.channelId == current.channelId) return;

        // Left a private room.
        if (
            old.channelId &&
            rooms?.find((x) => x.main_channel_id == old.channelId)
        ) {
            this.leaveHub(old).catch((e) => console.error(e));
        }

        if (current.channelId) {
            // User joined the main room.
            if (guildConfig?.privateRoomID == current.channelId) {
                this.createHub(current).catch((e) => console.error(e));
            }

            // User joined a private room.
            if (rooms?.find((x) => x.main_channel_id == current.channelId)) {
                this.joinHub(current).catch((e) => console.error(e));
            }
            // User joined waiting room.
            const waitJoin = rooms?.find(
                (x) => x.wait_channel_id == current.channelId,
            );
            if (waitJoin) {
                this.joinWaiting(current, waitJoin).catch((e) =>
                    console.error(e),
                );
            }
        }
    }

    private async joinWaiting(vc: VoiceState, room: private_vc) {
        const member = vc.member as GuildMember;
        if (this.notifyRatelimit.has(member.id)) return;

        const mainRoom = await vc.guild.channels.fetch(room.main_channel_id);
        if (!mainRoom) return;

        if (mainRoom.permissionOverwrites.cache.get(member.id)) return;
        if (!mainRoom.isTextBased()) return;

        await mainRoom
            .send(
                `Hey <@${room.user_id}>, ${member.displayName} has joined the waiting room.`,
            )
            .catch((e) => console.error(e));

        this.notifyRatelimit.add(member.id);
        setTimeout(() => this.notifyRatelimit.delete(member.id), 180000);
    }

    private startDelete(
        vc: VoiceBasedChannel,
        duration: number,
        reason: string,
    ) {
        this.deleteTimeout.set(
            vc.id,
            setTimeout(() => this.disbandVC(vc, reason), duration * 1000),
        );
    }

    private cancelDelete(vc: VoiceBasedChannel) {
        const timeout = this.deleteTimeout.get(vc.id);
        if (timeout) clearTimeout(timeout);
        this.deleteTimeout.delete(vc.id);
    }

    private async leaveHub(vc: VoiceState) {
        if (!vc.channel) return;
        const memberCount = this.getMemberCount(vc);

        // If the member count is 0 or 1, start the delete room timeout.
        if (memberCount == 0)
            this.startDelete(
                vc.channel,
                env.ABANDON_TIMEOUT * 60,
                "The room was abandoned for too long.",
            );
        else if (memberCount == 1) {
            this.startDelete(
                vc.channel,
                env.ALONE_TIMEOUT * 60,
                "User was alone in vc for too long.",
            );
        }
    }

    private async joinHub(vc: VoiceState) {
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

    private async createHub(vc: VoiceState) {
        const member = vc.member as GuildMember;

        if (this.createRateLimit.has(member.id) && member.id !== env.OWNER_ID)
            return;

        const guildConfig = GuildConfig.getGuild(vc.guild.id);
        if (!guildConfig) return;

        const activeVC = guildConfig.privateRooms;

        if (activeVC.length > 0) {
            // Already has a vc.
            if (activeVC.find((x) => x.user_id == member.id)) return;
            // Limit reached.
            if (activeVC.length >= guildConfig.privateRoomLimit) {
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
        const botIds = (vc.client as RavenClient).musicService.getBotIds();

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
            id: guildConfig.staff_role || "",
            allow: PermissionFlagsBits.ViewChannel,
        };

        // Generate channel name.
        const random1 = randomRange(0, this.adjectives.length);
        const random2 = randomRange(0, this.nouns.length);
        const channelName = this.adjectives[random1] + this.nouns[random2];

        const roomList = [ownerPerms, mainPerms].concat(owletsPerms);
        const waitList = [ownerPerms, waitingPerms].concat(owletsPerms);

        if (guildConfig.staff_role) {
            roomList.push(staffPerms);
            waitList.push(staffPerms);
        }

        // Create rooms.
        const room = await vc.guild.channels.create({
            type: ChannelType.GuildVoice,
            name: `🔒 ${channelName} VC`,
            permissionOverwrites: roomList,
            parent: guildConfig.privateRoomCategory as string,
        });

        const wait = await vc.guild.channels.create({
            type: ChannelType.GuildVoice,
            permissionOverwrites: waitList,
            name: `🕐 ${channelName} Waiting Room`,
            parent: guildConfig.privateRoomCategory as string,
        });

        // Put into db and update local config.
        await db.private_vc.create({
            data: {
                user_id: member.id,
                guild_id: vc.guild.id,
                main_channel_id: room.id,
                wait_channel_id: wait.id,
            },
        });

        await GuildConfig.updateGuild(vc.guild.id);

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
            env.ALONE_TIMEOUT * 60,
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

        logService.log(embed, vc.guild.id, logType.BOT);
    }

    public async disbandVC(
        vc: VoiceBasedChannel,
        reason: string | null = null,
    ) {
        this.cancelDelete(vc);
        const client = vc.client as RavenClient;

        const query = await db.private_vc.findUnique({
            where: { main_channel_id: vc.id },
        });
        if (!query) return;

        this.createRateLimit.add(query.user_id);
        setTimeout(() => this.createRateLimit.delete(query.user_id), 180000);

        // Fetch rooms.
        const mainRoom = await vc.guild.channels
            .fetch(query.main_channel_id)
            .catch((x) => console.error(x));

        const WaitRoom = await vc.guild.channels
            .fetch(query.wait_channel_id)
            .catch((x) => console.error(x));

        // Attempt to delete rooms.
        if (mainRoom)
            mainRoom.deletable
                ? await mainRoom
                      .delete("Session expired")
                      .catch((x) => console.error(x))
                : console.error(`Couldnt delete ${mainRoom.id}`.red);
        if (WaitRoom)
            WaitRoom.deletable
                ? await WaitRoom.delete("Session expired").catch((x) =>
                      console.error(x),
                  )
                : console.error(`Couldnt delete ${WaitRoom.id}`.red);

        // Remove from db.
        await db.private_vc.delete({ where: { main_channel_id: vc.id } });

        GuildConfig.updateGuild(vc.guild.id);

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
                    !client.musicService.getBotIds().includes(x.id) &&
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
        logService.log(embed, vc.guild.id, logType.BOT);
    }

    private getMemberCount(vc: VoiceState) {
        if (!vc.channel) return 0;
        const members = vc.channel.members.filter((x) => !x.user.bot);
        return members.size;
    }
}

declare const global: NodeJS.Global & { VCService: VCServiceClass };
const VCService: VCServiceClass = global.VCService || new VCServiceClass();
if (env.isDevelopment) global.VCService = VCService;

export default VCService;
