import {
    GuildChannelCreateOptions,
    GuildMember,
    OverwriteResolvable,
    OverwriteType,
    PermissionFlagsBits,
    VoiceChannel,
    VoiceState,
} from "discord.js";
import RavenClient from "../types/ravenClient";
import db from "../lib/db.service";
import { getAvatar, randomRange } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import { private_vc } from "@prisma/client";
import logService from "./logger.service";
import { embedTemplate } from "../lib/embedTemplate";
import env from "./env";
import path from "path";
import fs from "fs";

interface RoomNames {
    adjectives: string[];
    nouns: string[];
}

class VCServiceClass {
    private createRateLimit: Set<string> = new Set();
    private notifyRatelimit: Set<string> = new Set();
    private delays: Map<string, NodeJS.Timeout> = new Map();
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

            const mainRoom = (await guild.channels
                .fetch(room.main_channel_id)
                .catch(() => null)) as VoiceChannel | null;
            const waitRoom = (await guild.channels
                .fetch(room.wait_channel_id)
                .catch(() => null)) as VoiceChannel | null;

            console.log(
                `  - main: ${room.main_channel_id} - ${mainRoom != null}`.cyan
                    .italic,
            );
            if (mainRoom !== null)
                console.log(
                    `  - members: ${mainRoom.members.size}`.cyan.italic,
                );

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
            " ✓ VC Service loaded with ".green.bold +
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

    private async leaveHub(vc: VoiceState) {
        const memberCount = this.getMemberCount(vc);
        if (memberCount == 0) this.disbandVC(vc);
        // else if (memberCount == 1) this.startDelete(vc, 180000);
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

    private async joinHub(vc: VoiceState) {
        const member = vc.member as GuildMember;
        if (!vc.channel) return;

        // Remove timeout if exists.
        const timeout = this.delays.get(vc.channelId as string);
        if (timeout) {
            clearTimeout(timeout);
            this.delays.delete(vc.channelId as string);
        }

        // Add join perms if not already have.
        if (vc.channel.permissionOverwrites.cache.get(member.id)) return;
        vc.channel.permissionOverwrites.create(member.id, {
            Connect: true,
            ViewChannel: true,
        });
    }

    private async createHub(vc: VoiceState) {
        const member = vc.member as GuildMember;

        if (this.createRateLimit.has(member.id)) return;

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
            id: vc.member?.id as string,
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

        // Room config.
        const roomConfig: GuildChannelCreateOptions = {
            type: 2,
            parent: guildConfig.privateRoomCategory as string,
        };

        const roomList = [ownerPerms, mainPerms].concat(owletsPerms);
        const waitList = [ownerPerms, waitingPerms].concat(owletsPerms);

        if (guildConfig.staff_role) {
            roomList.push(staffPerms);
            waitList.push(staffPerms);
        }

        // Create rooms.
        const room = (await vc.guild.channels.create(`🔒 ${channelName} VC`, {
            ...roomConfig,
            permissionOverwrites: roomList,
        })) as unknown as VoiceChannel;

        const wait = (await vc.guild.channels.create(
            `🕐 ${channelName} Waiting Room`,
            { ...roomConfig, permissionOverwrites: waitList },
        )) as unknown as VoiceChannel;

        await room.setBitrate(96_000).catch(() => null);

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
        const moved = await vc.member?.voice
            .setChannel(room.id, "Created private room")
            .catch(() => null);

        if (!moved) {
            await room.delete().catch(() => null);
            await wait.delete().catch(() => null);
            return;
        }

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

        logService.logEvent(embed, vc.guild.id);
    }

    public async disbandVC(vc: VoiceState) {
        if (!vc.channel || !vc.channelId) return;
        const channelId = vc.channelId;
        const query = await db.private_vc.findUnique({
            where: { main_channel_id: channelId },
        });
        if (!query) return;

        this.createRateLimit.add(query.user_id);
        setTimeout(() => this.createRateLimit.delete(query.user_id), 180000);

        const mainRoom = await vc.guild.channels
            .fetch(query.main_channel_id)
            .catch((x) => console.error(x));
        const WaitRoom = await vc.guild.channels
            .fetch(query.wait_channel_id)
            .catch((x) => console.error(x));

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

        await db.private_vc.delete({ where: { main_channel_id: channelId } });

        GuildConfig.updateGuild(vc.guild.id);

        // Log event.
        const embed = embedTemplate();
        embed.setTitle("Private Room Disbanded");
        embed.setDescription(mainRoom?.name || "Unknown name");

        logService.logEvent(embed, vc.guild.id);
    }

    private getMemberCount(vc: VoiceState) {
        const channel = vc.channel as VoiceChannel;
        const members = channel.members.filter((x) => !x.user.bot);
        return members.size;
    }
}

declare const global: NodeJS.Global & { VCService: VCServiceClass };
const VCService: VCServiceClass = global.VCService || new VCServiceClass();
if (env.isDevelopment) global.VCService = VCService;

export default VCService;
