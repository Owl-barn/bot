import { embedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";


export default Command(

  // Info
  {
    name: "roll",
    description: "Roll the dice",
    group: CommandGroup.general,

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "sides",
        description: "How many sides does the dice have?",
        required: false,
        min: 2,
        max: 100,
      },
    ],

    throttling: {
      duration: 10,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const sides = msg.options.getInteger("sides", false) ?? 6;
    const roll = Math.floor(Math.random() * sides) + 1;

    const descriptionParts = [
      `${msg.user} rolled a ${roll}`,
    ];

    // coin flip if it's a two-sided die
    if (sides === 2)
      descriptionParts.push(roll === 1 ? "Heads" : "Tails");

    const embed = embedTemplate()
      .setTitle(`D${sides} dice roll`)
      .setDescription(descriptionParts.join(" | "));

    return { embeds: [embed] };
  }
);
