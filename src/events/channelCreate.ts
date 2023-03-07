import { Event } from "@structs/event";
import { GuildChannel } from "discord.js";

export default {
  name: "channelCreate",
  once: false,

  async execute(channel: GuildChannel): Promise<void> {
    channel && console.log(`new channel: ${channel.name}: ${channel.guild.name}`.yellow);
  },

} as Event;
