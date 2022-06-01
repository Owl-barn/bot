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
import db from "./db.service";
import { randomRange } from "./functions.service";
import GuildConfig from "./guildconfig.service";
import owlets from "../owlets.json";
import { private_vc } from "@prisma/client";
import roomNames from "../roomNames.json";

class VCServiceClass {
    private createRateLimit: Set<string> = new Set();
    private notifyRatelimit: Set<string> = new Set();
    private delays: Map<string, NodeJS.Timeout> = new Map();
    private adjectives: string[] = [];
    private nouns: string[] = [];

    public async initialize(client: RavenClient) {
        const rooms = await db.private_vc.findMany();
        if (
            roomNames &&
            roomNames.adjectives.length > 0 &&
            roomNames.nouns.length > 0
        ) {
            this.adjectives = roomNames.adjectives;
            this.nouns = roomNames.nouns;
        } else {
            this.adjectives = ["Private", "Secret", "Hidden", "Secret"];
            this.nouns = ["Room", "Basement", "Attic", "Chambers"];
        }

        for (const room of rooms) {
            const guild = client.guilds.cache.get(room.guild_id);
            if (!guild) {
                await db.private_vc.deleteMany({
                    where: { guild_id: room.guild_id },
                });
                continue;
            }

            const mainRoom = guild.channels.cache.get(
                room.main_channel_id,
            ) as VoiceChannel;
            const waitRoom = guild.channels.cache.get(
                room.wait_channel_id,
            ) as VoiceChannel;

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

        console.log("VC Service loaded");
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

        for (const owlet of owlets) {
            const botPerms: OverwriteResolvable = {
                id: owlet.id,
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
            deny: PermissionFlagsBits.Speak | PermissionFlagsBits.Stream,
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

        GuildConfig.updateGuild(vc.guild.id);

        // Move user.
        await vc.member?.voice.setChannel(room.id, "Created private room");
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
    }

    private getMemberCount(vc: VoiceState) {
        const channel = vc.channel as VoiceChannel;
        const members = channel.members.filter((x) => !x.user.bot);
        return members.size;
    }
}

declare const global: NodeJS.Global & { VCService: VCServiceClass };
const VCService: VCServiceClass = global.VCService || new VCServiceClass();
if (process.env.NODE_ENV === "development") global.VCService = VCService;

export default VCService;
