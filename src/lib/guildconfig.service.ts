import { guilds } from "@prisma/client";
import db from "./db.service";

class GuildConfigClass {
    private guilds: Map<string, GuildConfigs> = new Map();

    public init = async () => {
        const guildQuery = await db.guilds.findMany();
        for (const guild of guildQuery) this.updateGuild(guild);
        console.log("Loaded guild configs");
    }

    public updateGuild = async (guild: guilds) => {
        const config: GuildConfigs = {
            privateRoomID: guild.vc_channel_id,
            privateRoomLimit: guild.vc_limit,

            levelEnabled: guild.level,
            levelModifier: guild.level_modifier,
            levelChannel: guild.level_channel,
            levelMessage: guild.level_message,
        };

        this.guilds.set(guild.guild_id, config);
    }

    public getGuild = (id: string) => this.guilds.get(id);
}

declare const global: NodeJS.Global & { GuildConfig: GuildConfigClass };
const GuildConfig: GuildConfigClass = global.GuildConfig || new GuildConfigClass();
if (process.env.NODE_ENV === "development") global.GuildConfig = GuildConfig;


export default GuildConfig;

export interface GuildConfigs {
    privateRoomID: string | null;
    privateRoomLimit: number;

    levelEnabled: boolean;
    levelModifier: number;
    levelMessage: string | null;
    levelChannel: string | null;
}