import { Guild } from "discord.js";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class implements RavenEvent {
    name = "guildCreate";
    once = false;

    async execute(guild: Guild): Promise<void> {
        try {
            if (!guild) throw "failed to register guild";

            const db = (guild.client as RavenClient).db;
            await db.guilds.create({ data: { guild_id: guild.id } });

        } catch (e) {
            console.error(e);
        }
    }
}