import { guilds, private_vc } from "@prisma/client";
import db from "./db.service";

class GuildConfigClass {
    private guilds: Map<string, GuildConfigs> = new Map();

    public init = async () => {
        const guildQuery = await db.guilds.findMany();
        for (const guild of guildQuery) this.updateGuild(guild);
        console.log("Loaded guild configs");
    };

    public updateGuild = async (guild: guilds | string) => {
        if (typeof guild == "string") {
            guild = (await db.guilds.findUnique({
                where: { guild_id: guild },
            })) as guilds;
        }
        const rooms = await db.private_vc.findMany({
            where: { guild_id: guild.guild_id },
        });

        const config: GuildConfigs = {
            privateRoomCategory: guild.vc_category_id,
            privateRoomID: guild.vc_channel_id,
            privateRoomLimit: guild.vc_limit,
            privateRooms: rooms,

            log_channel: guild.log_channel,
            staff_role: guild.staff_role,

            premium: guild.premium,
            dev: guild.dev,
            banned: guild.banned,

            levelEnabled: guild.level,
            levelModifier: guild.level_modifier,
            levelChannel: guild.level_channel,
            levelMessage: guild.level_message,
        };

        this.guilds.set(guild.guild_id, config);
    };

    public getGuild = (id: string) => this.guilds.get(id);
}

declare const global: NodeJS.Global & { GuildConfig: GuildConfigClass };
const GuildConfig: GuildConfigClass =
    global.GuildConfig || new GuildConfigClass();
if (process.env.NODE_ENV === "development") global.GuildConfig = GuildConfig;

export default GuildConfig;

export interface GuildConfigs {
    privateRoomID: string | null;
    privateRoomCategory: string | null;
    privateRoomLimit: number;
    privateRooms: private_vc[];

    log_channel: string | null;

    staff_role: string | null;

    premium: boolean;
    dev: boolean;
    banned: boolean;

    levelEnabled: boolean;
    levelModifier: number;
    levelMessage: string | null;
    levelChannel: string | null;
}
