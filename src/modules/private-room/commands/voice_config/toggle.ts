import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { OverwriteResolvable, ChannelType } from "discord.js";
import { localState } from "../..";

export default SubCommand(

  // Info
  {
    name: "toggle",
    description: "Toggle private vcs.",

    botPermissions: ["ManageChannels", "ManageRoles"],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guild) throw "No guild???";

    let channelID = null;
    let categoryID = null;
    const config = await state.db.guild.findUnique({
      where: { id: msg.guild.id },
    });
    if (!config) throw "No guild??";

    if (config.privateRoomChannelId) {
      const channel = msg.guild?.channels.cache.get(config.privateRoomChannelId);
      const category = config.privateRoomCategoryId && msg.guild?.channels.cache.get(config.privateRoomCategoryId);

      if (channel) await channel.delete().catch(console.error);
      if (category)
        await category.delete().catch(console.error);

      const vcs = await state.db.privateRoom.findMany({
        where: { guildId: msg.guildId as string },
      });

      for (const vc of vcs) {
        const main = msg.guild?.channels.cache.get(vc.mainRoomId);
        const wait = msg.guild?.channels.cache.get(vc.waitingRoomId);
        await main?.delete().catch(console.error);
        await wait?.delete().catch(console.error);
      }
    } else {
      const botPermissions: OverwriteResolvable = {
        id: msg.client.user?.id as string,
        allow: [
          "ViewChannel",
          "Connect",
          "ManageChannels",
          "MoveMembers",
          "Stream",
          "Speak",
        ],
      };

      const basepermissions: OverwriteResolvable = {
        id: msg.guild.id,
        allow: ["Connect"],
        deny: ["Speak", "Stream"],
      };

      const category = await msg.guild?.channels.create({
        name: "🔒 Private Rooms",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [botPermissions, basepermissions],
      });

      if (!category) throw "Couldnt make category channel.";

      const channel = await msg.guild?.channels.create({
        name: "Create private room",
        type: ChannelType.GuildVoice,
        parent: category.id,
      });

      if (!channel || !category) throw "Couldnt make vc";

      channelID = channel.id;
      categoryID = category.id;
    }

    const query = await state.db.guild.update({
      where: { id: config.id },
      data: { privateRoomChannelId: channelID, privateRoomCategoryId: categoryID },
    });

    localState.controller.updateConfig(query);

    const response = channelID
      ? `Enabled private vcs <#${channelID}>`
      : "Removed private vcs";

    const embed = embedTemplate(response);

    return { embeds: [embed] };
  }
);
