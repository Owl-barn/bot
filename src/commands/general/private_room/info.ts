import { ApplicationCommandOptionType, VoiceChannel } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "info",
      description: "Get information about a private room.",

      arguments: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "room",
          description: "private room to get information about",
          required: true,
        },
      ],

      throttling: {
        duration: 60,
        usages: 3,
      },
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    let room = msg.options.getChannel("room", true);

    const fail = failEmbedTemplate();
    const embed = embedTemplate();

    const privateRoom = await msg.client.db.private_vc.findFirst({
      where: {
        OR: [
          { main_channel_id: room.id },
          { wait_channel_id: room.id },
        ],
      },
    });

    if (!privateRoom)
      return {
        embeds: [fail.setDescription("Channel is not a private room")],
      };

    const timeStamp = Math.round(Number(privateRoom.created) / 1000);

    room = room as VoiceChannel;
    embed.setTitle(room.name.split(" ")[1]);
    embed.setDescription(`Private Room Info`);
    embed.addFields([
      { name: "Owner", value: `<@${privateRoom.user_id}>`, inline: true },
      {
        name: "Active since",
        value: `<t:${timeStamp}:R>`,
        inline: true,
      },
    ]);

    return { embeds: [embed] };
  }
};
