import { guilds, private_vc, rcon } from "@prisma/client";
import env from "../modules/env";
import db from "./db.service";

class GuildConfigClass {
    private guilds: Map<string, GuildConfigs> = new Map();

    public init = async () => {
        const guildQuery = await db.guilds.findMany();
        for (const guild of guildQuery) this.updateGuild(guild);
        console.log(
            " ✓ Loaded ".green.bold +
                String(guildQuery.length).cyan +
                " guild configs".green.bold,
        );
    };

    /**
     * Update the guild config cache for a guild.
     * @param guild `guildId` or `prisma.guilds`
     * */
    public updateGuild = async (guild: guilds | string) => {
        if (typeof guild == "string") {
            guild = (await db.guilds.findUnique({
                where: { guild_id: guild },
            })) as guilds;
        }
        const rooms = await db.private_vc.findMany({
            where: { guild_id: guild.guild_id },
        });

        const rconQuery = await db.rcon.findUnique({
            where: { guild_id: guild.guild_id },
        });

        const config: GuildConfigs = {
            privateRoomCategory: guild.vc_category_id,
            privateRoomID: guild.vc_channel_id,
            privateRoomLimit: guild.vc_limit,

            privateRooms: rooms,
            rcon: rconQuery,

            log_join_leave: guild.log_join_leave,
            log_events: guild.log_events,
            log_bot: guild.log_bot,
            staff_role: guild.staff_role,
            unban_notice: guild.unban_notice,

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

    /**
     * Get the guild config for a guild.
     * @param id `guildId`
     * @returns guildConfig
     */
    public getGuild = (id: string) => this.guilds.get(id);
}

declare const global: NodeJS.Global & { GuildConfig: GuildConfigClass };
const GuildConfig: GuildConfigClass =
    global.GuildConfig || new GuildConfigClass();
if (env.isDevelopment) global.GuildConfig = GuildConfig;

export default GuildConfig;

export interface GuildConfigs {
    privateRoomID: string | null;
    privateRoomCategory: string | null;
    privateRoomLimit: number;
    privateRooms: private_vc[];
    rcon: rcon | null;

    log_join_leave: string | null;
    log_events: string | null;
    log_bot: string | null;

    staff_role: string | null;
    unban_notice: string | null;

    premium: boolean;
    dev: boolean;
    banned: boolean;

    levelEnabled: boolean;
    levelModifier: number;
    levelMessage: string | null;
    levelChannel: string | null;
}
