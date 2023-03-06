import { Guild } from "discord.js";
import { failEmbedTemplate } from "../lib/embedTemplate";
import env from "../modules/env";
import RavenEvent from "../types/event";

export default class implements RavenEvent {
  name = "guildDelete";
  once = false;

  async execute(guild: Guild): Promise<void> {
    try {
      if (!guild) throw "failed to log deleted guild";

      console.log(
        `Left Guild, ID: ${guild.id} Owner: ${guild.ownerId} Name: ${guild.name}`
          .red.bold,
      );

      const notifEmbed = failEmbedTemplate()
        .setTitle("Guild deleted")
        .setDescription(
          `Name: ${guild.name}\n` +
                        `ID: ${guild.id}\n` +
                        `Owner: ${guild.ownerId}\n` +
                        `Membercount: ${guild.memberCount}`,
        );

      await (await guild.client.users.fetch(env.OWNER_ID))
        .send({ embeds: [notifEmbed] })
        .catch(() => null);
    } catch (e) {
      console.error(e);
    }
  }
}
