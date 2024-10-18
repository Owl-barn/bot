import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "toggle",
    description: "Toggle the level system",

    arguments: [
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "use_level_system",
        description: "Should the level system be enabled?",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "message_experience_gain",
        description: "Should users be able to gain XP through messaging?",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "voice_experience_gain",
        description: "Should users be able to gain XP through using voice channels?",
        required: true,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const levelSystemEnabled = msg.options.getBoolean("use_level_system", true);
    const levelMessageXPGain = msg.options.getBoolean("message_experience_gain", true);
    const levelVoiceXPGain = msg.options.getBoolean("voice_experience_gain", true);

    const guild = await state.db.guild.update({
      where: { id: msg.guild.id },
      data: { levelSystemEnabled, levelMessageXPGain, levelVoiceXPGain },
    });

    state.guilds.set(guild.id, guild);

    const embed = embedTemplate();
    embed.setTitle("Level system configuration");
    embed.setDescription(
      `Level system enabled: ${guild.levelSystemEnabled ? "✅" : "❌"}\n` +
      `Message experience gain: ${guild.levelMessageXPGain ? "✅" : "❌"}${!guild.levelSystemEnabled && guild.levelMessageXPGain ? "*" : ""}\n` +
      `Voice experience gain: ${guild.levelVoiceXPGain ? "✅" : "❌"}${!guild.levelSystemEnabled && guild.levelVoiceXPGain ? "*" : ""}` +
      (!guild.levelSystemEnabled && (guild.levelMessageXPGain || guild.levelVoiceXPGain) ? "\n*\\*Level system must be enabled for this to take effect.*" : "")
    );

    return { embeds: [embed] };
  }
);
