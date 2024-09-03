import { state } from "@app";

export async function loadGuilds() {
  let guilds = await state.db.guild.findMany();

  const unregisteredGuilds: { id: string }[] = [];

  for (const guild of state.client.guilds.cache.values()) {
    if (!guilds.find((g) => g.id === guild.id)) {
      unregisteredGuilds.push({ id: guild.id });
    }
  }

  if (unregisteredGuilds.length > 0) {
    await state.db.guild.createMany({ data: unregisteredGuilds });
    guilds = await state.db.guild.findMany();
  }

  guilds.forEach((guild) => state.guilds.set(guild.id, guild));
}
