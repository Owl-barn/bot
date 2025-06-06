import { state } from "@app";
import { Event } from "@structs/event";
import { connectGuildUserConfig } from "../lib/connect";

export default Event({
  name: "interactionCreate",
  once: false,

  async execute(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guild) return;

    let data = { lastCommandActivity: new Date() };

    await state.db.userGuildConfig.upsert({
      where: { userId_guildId: { userId: user.id, guildId: guild.id } },
      update: data,
      create: {
        ...data,
        ...connectGuildUserConfig(guild.id, user.id),
      }
    });
  }
});
