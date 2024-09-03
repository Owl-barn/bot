import { state } from "@app";
import { Guild } from "discord.js";

export async function getOrCreateGuild(guild: Guild) {
  let dbGuild = await state.db.guild.findUnique({ where: { id: guild.id } });

  if (!dbGuild) {
    dbGuild = await state.db.guild.create({ data: { id: guild.id } });
    state.guilds.set(guild.id, dbGuild);
    state.log.info(`Created guild db entry: ${guild.id} - ${guild.name}`);
  }

  return dbGuild;
}
