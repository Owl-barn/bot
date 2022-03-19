import { GuildMember, OverwriteResolvable, VoiceChannel, VoiceState } from "discord.js";
import RavenClient from "../types/ravenClient";
import db from "./db.service";
import GuildConfig from "./guildconfig.service";

const adjectives = ["Cool", "Fancy", "Nice", "Swaggy", "Based", "Stinky", "Mommy", "Irish",
    "Musical", "Happy", "Big", "Sussy", "Goth", "Swedish"];
const nouns = ["Owl", "Borb", "Frog", "Froggy", "Pigeon", "Ogre", "Clara", "HousePlant", "Goth"];

class VCServiceClass {
    private ratelimit: Set<string> = new Set();
    private delays: Map<string, NodeJS.Timeout> = new Map();

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
        const guildConfig = GuildConfig.getGuild(current.guild.id);
        const rooms = guildConfig?.privateRooms;

        if (old.channelId == current.channelId) return;
        if (old.channelId && rooms?.find(x => x.main_channel_id == old.channelId)) {
            this.leaveHub(old);
        }
        if (current.channelId) {
            if (guildConfig?.privateRoomID == current.channelId) {
                this.createHub(current);
            }
            if (rooms?.find(x => x.main_channel_id == current.channelId)) {
                this.joinHub(current);
            }
        }
    }

    private startDelete(vc: VoiceState, delay: number) {
        this.delays.set(vc.channelId as string, setTimeout(() => this.disbandVC(vc).catch(e => console.error(e)), delay));
    }

    private async leaveHub(vc: VoiceState) {
        const channel = vc.channel as VoiceChannel;
        const members = channel.members.filter(x => !x.user.bot);
        console.log(`Member left: ${members.size}`.red);
        if (members.size <= 1) {
            const delay = members.size == 1 ? 180000 : 60000;
            console.log(`delete delay start: ${delay}`.red);
            this.startDelete(vc, delay);
        }
    }

    private async joinHub(vc: VoiceState) {
        const member = vc.member as GuildMember;
        if (!vc.channel || !vc.channel.manageable) return;
        if (member.user.bot) return;
        console.log(`Member joined`.green);

        const timeout = this.delays.get(vc.channelId as string);
        if (timeout) {
            clearTimeout(timeout);
            this.delays.delete(vc.channelId as string);

            const channel = vc.channel as VoiceChannel;
            const members = channel.members.filter(x => !x.user.bot);

            console.log(`delete delay removed, size: ${members.size}`.green);
            if (members.size == 1) {
                this.startDelete(vc, 180000);
                console.log(`delete delay added 180000`.red);
            }
        }

        if (vc.channel.permissionOverwrites.cache.get(member.id)) return;
        vc.channel.permissionOverwrites.create(member.id, { CONNECT: true });
    }

    private async createHub(vc: VoiceState) {
        const member = vc.member as GuildMember;
        if (this.ratelimit.has(member.id)) return;
        const guildConfig = GuildConfig.getGuild(vc.guild.id);
        if (!guildConfig) return;

        const activeVC = await db.private_vc.findMany({ where: { guild_id: vc.guild.id } });

        if (activeVC.length > 0) {
            // Already has a vc.
            if (activeVC.find(x => x.user_id == member.id)) return;
            // Limit reached.
            if (activeVC.length >= guildConfig.privateRoomLimit) {
                const dm = await member.createDM();
                await dm.send("Sorry the maximum number of private rooms are used in this server, Please try again later.. 🦉").catch(null);
                return;
            }
        }

        console.log("Creating hub...");

        const roomOwner: OverwriteResolvable = { id: vc.member?.id as string, allow: ["MOVE_MEMBERS", "CONNECT"] };
        const roomBot: OverwriteResolvable = { id: vc.client.user?.id as string, allow: ["MANAGE_CHANNELS", "VIEW_CHANNEL", "CONNECT"] };
        const roomLock: OverwriteResolvable = { id: vc.guild.id, deny: ["CONNECT"], allow: ["STREAM"] };

        const channelName = adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)];

        const room = await vc.guild.channels.create(`🔒 ${channelName} VC`,
            {
                type: 2,
                parent: guildConfig.privateRoomCategory as string,
                permissionOverwrites: [roomBot, roomLock, roomOwner],
            },
        );

        const wait = await vc.guild.channels.create(`🕐 ${channelName} Waiting Room`,
            {
                type: 2,
                parent: guildConfig.privateRoomCategory as string,
                permissionOverwrites: [roomBot, roomOwner],
            },
        );

        await db.private_vc.create({ data: { user_id: member.id, guild_id: vc.guild.id, main_channel_id: room.id, wait_channel_id: wait.id } });
        GuildConfig.updateGuild(vc.guild.id);

        await vc.member?.voice.setChannel(room.id, "Created private room");
        this.startDelete(vc, 180000);
        console.log(`delete delay added 180000`.red);
    }

    public async disbandVC(vc: VoiceState) {
        if (!vc.channel || !vc.channelId) return;
        const channelId = vc.channelId;
        const query = await db.private_vc.findUnique({ where: { main_channel_id: channelId } });
        if (!query) return;

        this.ratelimit.add(query.user_id);
        setTimeout(() => this.ratelimit.delete(query.user_id), 180000);

        const mainRoom = await vc.guild.channels.fetch(query.main_channel_id).catch(x => console.error(x));
        const WaitRoom = await vc.guild.channels.fetch(query.wait_channel_id).catch(x => console.error(x));

        if (mainRoom) mainRoom.deletable ? await mainRoom.delete("Session expired").catch(x => console.error(x)) : console.error(`Couldnt delete ${mainRoom.id}`.red);
        if (WaitRoom) WaitRoom.deletable ? await WaitRoom.delete("Session expired").catch(x => console.error(x)) : console.error(`Couldnt delete ${WaitRoom.id}`.red);

        await db.private_vc.delete({ where: { main_channel_id: channelId } });

        GuildConfig.updateGuild(vc.guild.id);
        console.log(`Deleted private room`);
    }
}

declare const global: NodeJS.Global & { VCService: VCServiceClass };
const VCService: VCServiceClass = global.VCService || new VCServiceClass();
if (process.env.NODE_ENV === "development") global.VCService = VCService;


export default VCService;