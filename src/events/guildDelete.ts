import { Guild } from "discord.js";
import RavenEvent from "../types/event";

export default class implements RavenEvent {
    name = "guildDelete";
    once = false;

    async execute(guild: Guild): Promise<void> {
        try {
            if (!guild) throw "failed to register guild";

            console.log(`Left Guild, ID: ${guild.id} Owner: ${guild.ownerId} Name: ${guild.name}`.red.bold);
        } catch (e) {
            console.error(e);
        }
    }
}