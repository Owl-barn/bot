import { private_vc } from "@prisma/client";
import { GuildMember, OverwriteResolvable, VoiceChannel, VoiceState } from "discord.js";
import RavenClient from "../types/ravenClient";
import db from "./db.service";
import GuildConfig from "./guildconfig.service";

class VCServiceClass {
    private rooms: private_vc[] = [];

    public async initialize(client: RavenClient) {
        const rooms = await db.private_vc.findMany();

        for (const room of rooms) {
            const guild = client.guilds.cache.get(room.guild_id);
            if (!guild) {
                await db.private_vc.deleteMany({ where: { guild_id: room.guild_id } });
                continue;
            }

            const mainRoom = guild.channels.cache.get(room.main_channel_id) as VoiceChannel;
            const waitRoom = guild.channels.cache.get(room.wait_channel_id) as VoiceChannel;

            if (!mainRoom && !waitRoom) {
                await db.private_vc.delete({ where: { main_channel_id: room.main_channel_id } });
                continue;
            }

            if (!mainRoom || mainRoom.members.size == 0) {
                await db.private_vc.delete({ where: { main_channel_id: room.main_channel_id } });

                mainRoom?.deletable ? await mainRoom.delete() : null;
                waitRoom?.deletable ? await waitRoom.delete() : null;

                continue;
            }

            this.rooms.push(room);
        }

        console.log("VC Service loaded");

    }

    public async onChange(old: VoiceState, current: VoiceState) {
        const member = current.member;
        const me = current.guild.me;
        if (!me) return;
        if (!me.permissions.has("MANAGE_CHANNELS") || !me.permissions.has("MOVE_MEMBERS")) return;

        if (!member) return;
        if (member.user.bot) return;

        if (old.channelId !== current.channelId && old.channelId && this.rooms.find(x => x.main_channel_id == old.channelId)) this.leaveHub(old);
        if (old.channelId !== current.channelId && current.channelId && GuildConfig.getGuild(current.guild.id)?.privateRoomID == current.channelId) this.createHub(current);
        if (old.channelId !== current.channelId && current.channelId && this.rooms.find(x => x.main_channel_id == current.channelId)) this.joinHub(current);
    }

    private async leaveHub(vc: VoiceState) {
        // const member = vc.member as GuildMember;
        const channel = vc.channel as VoiceChannel;
        if (channel.members.filter(x => !x.user.bot).size == 0) return this.disbandVC(vc);
        // if (!this.rooms.find(x => x.user_id == member.id && x.guild_id == vc.guild.id)) return;
        return;
    }

    private async joinHub(vc: VoiceState) {
        if (!vc.channel || !vc.channel.manageable) return;
        vc.channel.permissionOverwrites.create((vc.member as GuildMember).id, { MOVE_MEMBERS: true });
    }

    private async createHub(vc: VoiceState) {
        const member = vc.member as GuildMember;

        const activeVC = await db.private_vc.findMany({ where: { guild_id: vc.guild.id } });

        if (activeVC.length > 0) {
            // Already has a vc.
            if (activeVC.find(x => x.user_id == member.id)) return;
            // Limit reached.
            if (activeVC.length >= (GuildConfig.getGuild(vc.guild.id)?.privateRoomLimit || 0)) {
                const dm = await member.createDM();
                await dm.send("Sorry the maximum number of private rooms are used in this server, Please try again later.. 🦉").catch(null);
                return;
            }
        }

        console.log("Creating hub...");

        const roomOwner: OverwriteResolvable = {
            id: vc.member?.id as string,
            allow: ["MOVE_MEMBERS", "CONNECT", "MUTE_MEMBERS", "DEAFEN_MEMBERS"],
        };

        const room = await vc.guild.channels.create(`🔒 ${member.nickname || member.user.username}'s VoiceChat`,
            {
                type: 2,
                permissionOverwrites: [roomOwner,
                    {
                        id: vc.guild.id,
                        deny: ["CONNECT"],
                    }],
            },
        );

        const wait = await vc.guild.channels.create(`🕐 ${member.nickname || member.user.username}'s waiting room`,
            {
                type: 2,
                permissionOverwrites: [roomOwner],
            },
        );

        const roomQuery = await db.private_vc.create({ data: { user_id: member.id, guild_id: vc.guild.id, main_channel_id: room.id, wait_channel_id: wait.id } });
        this.rooms.push(roomQuery);

        await vc.member?.voice.setChannel(room.id, "Created private room");
    }

    public async disbandVC(vc: VoiceState) {
        const query = await db.private_vc.findUnique({ where: { user_id_guild_id: { user_id: (vc.member as GuildMember).id, guild_id: vc.guild.id } } });
        if (!query) return;

        await (await vc.guild.channels.fetch(query.main_channel_id))?.delete("Session expired");
        await (await vc.guild.channels.fetch(query.wait_channel_id))?.delete("Session expired");

        await db.private_vc.delete({ where: { user_id_guild_id: { user_id: (vc.member as GuildMember).id, guild_id: vc.guild.id } } });

        console.log(`Deleted private room`);
    }
}

declare const global: NodeJS.Global & { VCService: VCServiceClass };
const VCService: VCServiceClass = global.VCService || new VCServiceClass();
if (process.env.NODE_ENV === "development") global.VCService = VCService;


export default VCService;