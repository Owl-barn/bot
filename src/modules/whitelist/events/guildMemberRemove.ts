import { state } from "@app";
import { getMcName, RCONHandler } from "../lib/mc.service";
import { Event } from "@structs/event";

export default Event({
  name: "guildMemberRemove",
  once: false,

  async execute(member) {
    if (!member.guild.id) return;

    const guild = await state.db.guilds.findUnique({
      where: { guild_id: member.guild.id },
      select: { rcon: true },
    });

    if (!guild) throw "Guild not found";

    if (guild.rcon.length > 0) {
      const whitelist = await state.db.whitelist
        .delete({
          where: {
            whitelist_guild_user_un: {
              guild_id: member.guild.id,
              user_id: member.id,
            },
          },
        })
        .catch(() => null);

      console.log({ whitelist });

      if (!whitelist) return;
      const mcName = await getMcName(whitelist.mc_uuid);

      console.log({ mcName });

      if (!mcName) return;
      const result = await RCONHandler(
        [`whitelist remove ${mcName}`],
        guild.rcon[0],
      ).catch(() => null);

      console.log({ result });
      if (!result) console.log(`Failed to remove ${member.id} from whitelist`);
      else console.log(`Removed ${member.id} from whitelist`);
    }
  },

});
