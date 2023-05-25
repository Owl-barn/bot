import { state } from "@app";
import { Events } from "../structs/events";
import { QueueEvent } from "../structs/queue";
import { failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { localState } from "..";

type Data = Events[QueueEvent.Shutdown] & {
  owletId: string;
};

const shutdown: (data: Data) => Promise<void> =
  async ({ guildId, channelId, owletId }) => {
    const guild = state.client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = await state.client.channels.fetch(channelId);
    if (!channel || !channel.isVoiceBased()) return;

    const bot = await guild?.members.fetch(owletId);
    if (!bot) return;

    const embed = failEmbedTemplate();

    embed.setAuthor({
      iconURL: getAvatar(bot),
      name: "Maintenance",
    });

    embed.setDescription(
      "There is currently bot maintenance going on, This music bot will restart after the song or after 10 minutes",
    );

    await channel.send({ embeds: [embed] })
      .catch((e) => localState.log.warn(`Failed to send shutdown embed in <#${channel.id.cyan}>.`, { data: e }));
  };

export { shutdown };
