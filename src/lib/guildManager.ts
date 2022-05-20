import { Guild } from "discord.js";
import RavenClient from "../types/ravenClient";
import prisma from "./db.service";

export default class GuildManager {
    guildID: string;
    guild: Guild;
    client: RavenClient;

    constructor(guild: string, client: RavenClient) {
        this.guildID = guild;
        this.client = client;
    }

    public async delete(): Promise<void> {
        const query = { where: { guild_id: this.guildID } };

        this.guild = await this.client.guilds.fetch(this.guildID);

        const left = await this.guild
            .leave()
            .catch(() => false)
            .then(() => true);

        const deleted = await prisma
            .$transaction([
                prisma.warnings.deleteMany(query),
                prisma.rcon.deleteMany(query),
                prisma.whitelist.deleteMany(query),
                prisma.logs.deleteMany(query),
                prisma.guilds.delete(query),
            ])
            .catch(() => false)
            .then(() => true);

        console.log(`Deleted: ${deleted} Left: ${left}`.yellow.italic);
    }
}
