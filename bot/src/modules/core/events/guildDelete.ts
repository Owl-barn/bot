import { Event } from "@structs/event";
import { state } from "@app";
import { failEmbedTemplate } from "@lib/embedTemplate";
import { localState } from "..";

export default Event({
  name: "guildDelete",
  once: false,
  ignoreBans: true,

  async execute(guild) {
    if (!guild) throw "failed to log deleted guild";
    localState.log.info(`Left Guild, ID: ${guild.id.cyan} Owner: ${guild.ownerId.cyan} Name: ${guild.name.green}`.red.bold);

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
  },
});
