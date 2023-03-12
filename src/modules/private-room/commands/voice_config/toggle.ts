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
    if (!msg.guildId) throw "No guildID???";

    let channelID = null;
    let categoryID = null;
    const config = await state.db.guilds.findUnique({
      where: { guild_id: msg.guildId as string },
    });
    if (!config) throw "No guild??";

    if (config.vc_channel_id) {
      const channel = msg.guild?.channels.cache.get(config.vc_channel_id);
      const category = msg.guild?.channels.cache.get(
        config.vc_category_id as string,
      );

      if (channel) await channel.delete().catch(console.error);
      if (category)
        await category.delete().catch(console.error);

      const vcs = await state.db.private_vc.findMany({
        where: { guild_id: msg.guildId as string },
      });

      for (const vc of vcs) {
        const main = msg.guild?.channels.cache.get(vc.main_channel_id);
        const wait = msg.guild?.channels.cache.get(vc.wait_channel_id);
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
        id: msg.guildId,
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

    const query = await state.db.guilds.update({
      where: { guild_id: msg.guildId as string },
      data: { vc_channel_id: channelID, vc_category_id: categoryID },
    });

    localState.controller.updateConfig(query);

    const response = channelID
      ? `Enabled private vcs <#${channelID}>`
      : "Removed private vcs";

    const embed = embedTemplate(response);

    return { embeds: [embed] };
  }
);
