import { Event } from "@src/structs/event";
import { failEmbedTemplate } from "../lib/embedTemplate";
import { state } from "@src/app";

export default Event({
  name: "guildDelete",
  once: false,

  async execute(guild) {
    try {
      if (!guild) throw "failed to log deleted guild";

      console.log(`Left Guild, ID: ${guild.id} Owner: ${guild.ownerId} Name: ${guild.name}`.red.bold);

      const notifEmbed = failEmbedTemplate()
        .setTitle("Guild deleted")
        .setDescription(
          `Name: ${guild.name}\n` +
          `ID: ${guild.id}\n` +
          `Owner: ${guild.ownerId}\n` +
          `Membercount: ${guild.memberCount}`,
        );

      await guild.client.users.fetch(state.env.OWNER_ID)
        .then((owner) => owner.send({ embeds: [notifEmbed] }))
        .catch(() => null);

    } catch (e) {
      console.error(e);
    }
  },
});
