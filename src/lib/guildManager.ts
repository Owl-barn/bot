import { Guild } from "discord.js";
import prisma from "./db.service";

export default class GuildManager {
    guildID: string;
    guild: Guild;

    constructor(guild: string) {
        this.guildID = guild;
    }

    public async delete(): Promise<void> {
        const query = { where: { guild_id: this.guildID } };

        const left = await this.guild.leave().catch(() => false).then(() => true);

        const deleted = await prisma.$transaction([
            prisma.warnings.deleteMany(query),
            prisma.permissions.deleteMany(query),
            prisma.rcon.deleteMany(query),
            prisma.whitelist.deleteMany(query),
            prisma.logs.deleteMany(query),
            prisma.guilds.delete(query),
        ]).catch(() => false).then(() => true);

        console.log(`Deleted: ${deleted} Left: ${left}`.yellow.italic);
    }
}