import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, VoiceChannel } from "discord.js";

export default SubCommand(

  // Info
  {
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
  },

  // Execute
  async (msg) => {
    let room = msg.options.getChannel("room", true);

    const fail = failEmbedTemplate();
    const embed = embedTemplate();

    const privateRoom = await state.db.private_vc.findFirst({
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
);
