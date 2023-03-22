import { state } from "@app";
import { getMcName, RCONHandler } from "../lib/mc.service";
import { Event } from "@structs/event";
import { localState } from "..";
import { getConfig } from "../lib/getConfig";

export default Event({
  name: "guildMemberRemove",
  once: false,

  async execute(member) {
    if (!member.guild.id) return;

    const guild = await getConfig(member.guild.id);

    if (!guild) return;

    const whitelist = await state.db.whitelist
      .delete({
        where: {
          whitelist_guild_user_un: {
            guildId: member.guild.id,
            userId: member.id,
          },
        },
      })
      .catch(() => null);

    if (!whitelist) return;
    const mcName = await getMcName(whitelist.minecraftId);

    if (!mcName) return;
    const result = await RCONHandler([`whitelist remove ${mcName}`], guild).catch(() => null);

    if (!result) localState.log.warn(`couldn't remove ${member.id.cyan} from whitelist in (${member.guild.id.cyan})`);
    else localState.log.info(`Removed ${member.id.cyan} from whitelist in (${member.guild.id.cyan})`);

  },

});
