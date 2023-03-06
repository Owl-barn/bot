import { GuildChannel } from "discord.js";
import RavenEvent from "../types/event";

export default class implements RavenEvent {
  name = "channelCreate";
  once = false;

  async execute(channel: GuildChannel): Promise<void> {
    try {
      if (!channel) return;
      console.log(
        `new channel: ${channel.name}: ${channel.guild.name}`.yellow,
      );
    } catch (e) {
      console.error(e);
    }
  }
}
