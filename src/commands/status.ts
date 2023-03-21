import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Status",

  // Command Run
  async run() {
    if (!state.client) return { error: "No client" };

    const id = state.client.user?.id;
    if (!id) return { error: "Bot is not ready" };

    const guilds: Guild[] = [];

    for (const guild of state.client.guilds.cache.values()) {
      const item: Guild = { id: guild.id };
      const channelId = guild.members.me?.voice.channelId;
      channelId && (item.channelId = channelId);
      guilds.push(item);
    }

    return {
      id,
      uptime: process.uptime(),
      guilds,
    };

  }
});

export interface Arguments { };

export interface Response {
  id: string;
  uptime: number;
  guilds: Guild[];
}

interface Guild {
  id: string;
  channelId?: string;
}
