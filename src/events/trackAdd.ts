import { Player, PlayerError, PlayerEvents } from "discord-player";
import { GuildChannel } from "discord.js";
import RavenEvent from "../types/event";

export default class implements RavenEvent {
    name = "TrackAdd";
    once = false;

    async execute(): Promise<void> {}
}
