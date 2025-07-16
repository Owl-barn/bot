import { state } from "@app";
import { RconClient } from "../lib/rcon.service";
import { Event } from "@structs/event";
import { localState } from "..";
import { getConfig } from "../lib/getConfig";
import { MinecraftUser } from "../lib/minecraft_api.service";

export default Event({
  name: "guildMemberRemove",
  once: false,

  async execute(member) {
    if (!member.guild.id) return;

    const guild = await getConfig(member.guild.id);

    if (!guild) return;

    const deletedWhitelist = await state.db.whitelist
      .delete({
        where: {
          whitelist_guild_user_un: {
            guildId: member.guild.id,
            userId: member.id,
          },
        },
      })
      .catch(() => null);

    if (!deletedWhitelist) return;
    const minecraftUser = await MinecraftUser.fromId(deletedWhitelist.minecraftId);

    if (!minecraftUser) {
      localState.log.warn(`Couldn't find Minecraft user for ${member.id.cyan} (${deletedWhitelist.minecraftId}) in ${member.guild.id.cyan}`);
      return;
    }

    try {
      await RconClient.removeUserFromWhitelist(guild, minecraftUser.name);
    } catch (error) {
      localState.log.warn(`couldn't remove ${member.id.cyan} from whitelist in (${member.guild.id.cyan})`, { error });
      return;
    }

    localState.log.info(`Removed ${member.id.cyan} from whitelist in (${member.guild.id.cyan})`);

  },

});
