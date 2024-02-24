import { state } from "@app";
import registerCommand from "@lib/command.register";

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

  if (unregisteredGuilds.length > 0) {
    for (const { id } of unregisteredGuilds) {
      const guild = await state.client.guilds.fetch(id);
      guild && await registerCommand(guild);
    }

    console.log(`- Registered `.cyan.bold + guilds.length.toString().green + ` new guild${guilds.length > 1 ? "s" : ""}`.cyan.bold);
  }
}
