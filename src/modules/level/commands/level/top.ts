import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { localState } from "../..";

export default SubCommand(

  // Info
  {
    name: "top",
    description: "View the server leaderboard.",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "Level Command didnt get guildID";
    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const config = localState.guilds.get(msg.guildId);
    if (!config || !config.level) {
      const response = failEmbed.setDescription(
        "Leveling is not enabled on this server.",
      );
      return { embeds: [response] };
    }

    embed.setTitle(`${msg.guild?.name} leaderboard`);
    embed.setDescription(
      "Click the link below to view the server's leaderboard",
    );

    const button = new ButtonBuilder()
      .setLabel("Leaderboard")
      .setStyle(ButtonStyle.Link)
      .setURL(`${state.env.URL}/leaderboard/${msg.guildId}`);

    const component =
      new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;
    component.addComponents([button]);

    return { embeds: [embed], components: [component] };
  }

);
