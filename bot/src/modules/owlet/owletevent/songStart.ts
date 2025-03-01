import { state } from "@app";
import { Events } from "../structs/events";
import { QueueEvent } from "../structs/queue";
import { embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { localState } from "..";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import skipButton from "../components/buttons/remove";


type Data = Events[QueueEvent.SongStart] & {
  owletId: string;
};

const songStart: (data: Data) => Promise<void> =
  async ({ track, channelId, guildId, owletId }) => {

    const guild = state.client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = await state.client.channels.fetch(channelId);
    if (!channel) return;

    const bot = await guild?.members.fetch(owletId);
    if (!bot) return;

    if (!channel.isVoiceBased()) return;
    const embed = embedTemplate();

    embed.setAuthor({
      iconURL: getAvatar(bot),
      name: "Now playing",
    });

    embed.setThumbnail(track.thumbnail);

    embed.addFields([
      {
        name: "Title",
        value: `[${track.title}](${track.url})`,
        inline: true,
      },
      {
        name: "Duration",
        value: track.duration,
        inline: true,
      },
    ]);

    const button = new ActionRowBuilder<ButtonBuilder>()
      .setComponents(new ButtonBuilder()
        .setCustomId(`${skipButton.info.name}-${track.id}`)
        .setLabel("Skip")
        .setStyle(ButtonStyle.Danger));

    await channel.send({ embeds: [embed], components: [button] }).catch((e) => {

      localState.log.warn(
        `Failed to send song start embed in <#${channel.id.cyan}>.`,
        { data: e }
      );
    });

  };

export { songStart };
