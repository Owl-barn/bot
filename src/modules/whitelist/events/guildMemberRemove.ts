import { state } from "@app";
import { getMcName, RCONHandler } from "../lib/mc.service";
import { Event } from "@structs/event";
import { localState } from "..";

export default Event({
  name: "guildMemberRemove",
  once: false,

  async execute(member) {
    if (!member.guild.id) return;

    const guild = await state.db.guild.findUnique({
      where: { id: member.guild.id },
      select: { rcon: true },
    });

    if (!guild) throw "Guild not found";

    if (guild.rcon.length > 0) {
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
      const result = await RCONHandler(
        [`whitelist remove ${mcName}`],
        guild.rcon[0],
      ).catch(() => null);

      if (!result) localState.log.warn(`couldn't remove ${member.id.cyan} from whitelist in (${member.guild.id.cyan})`);
      else localState.log.info(`Removed ${member.id.cyan} from whitelist in (${member.guild.id.cyan})`);
    }
  },

});
