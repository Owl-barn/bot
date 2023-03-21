import { state } from "@app";
import { Command } from "@structs/command";
import { Guild } from "@structs/commands/status";

export default Command({
  // Command Info
  name: "Status",

  // Command Run
  async run() {
    if (!state.client) throw "No client";

    const id = state.client.user?.id;
    if (!id) throw "Bot is not ready";

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
