import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";
import path from "path";
import fs from "fs/promises";
import gm from "gm";

export default Command(

  // Info
  {
    name: "vcfish",
    description: "Vc fish gif",
    group: CommandGroup.general,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "prompt",
        description: "What should the fish say?",
        required: true,
      },
    ],

    throttling: {
      duration: 60,
      usages: 2,
    },
  },

  // Execute
  async (msg) => {
    const prompt = msg.options.getString("prompt", true);

    const fish = await fs.readdir(path.join(process.cwd(), "config", "fish"));
    const fishFile = fish[Math.floor(Math.random() * fish.length)];
    const fishPath = path.join(process.cwd(), "config", "fish", fishFile);
    const buffer = await fs.readFile(fishPath);

    await msg.deferReply();

    // Draw prompt on bottom center of gif
    const attachment = gm(buffer)
      .fill("#ffffff")
      .font("Arial", 32)
      .drawText(0, 16, prompt, "South")
      .stream();

    return {
      files: [
        {
          attachment,
          name: "fish.gif",
        },
      ],
    };
  }
);
