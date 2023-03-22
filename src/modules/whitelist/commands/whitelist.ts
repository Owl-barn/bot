import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import { getMcUUID, RCONHandler } from "../lib/mc.service";
import { getConfig } from "../lib/getConfig";

export default Command(

  // Info
  {
    name: "whitelist",
    description: "whitelist to mc server",
    group: CommandGroup.general,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "mc_name",
        description: "What mc account to whitelist",
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
    let username = msg.options.getString("mc_name", true);

    await msg.deferReply();

    username = username.trim().substring(0, 64);
    const author = msg.member as GuildMember;

    // Get guild.
    const config = await getConfig(msg.guildId);

    // Check if connected server.
    if (config === null) {
      const response = failEmbedTemplate(
        "No minecraft server connected to this guild.",
      );
      return { embeds: [response] };
    }

    // Get UUID
    let uuid = await getMcUUID(username);

    // Check if exists.
    if (!uuid)
      return {
        embeds: [failEmbedTemplate("mc account doesn't exist")],
      };

    // Check if already registered.
    const userExists = await state.db.whitelist.findFirst({
      where: {
        OR: [{ userId: author.id }, { minecraftId: uuid }],
      },
    });

    // Check if already in db.
    if (userExists !== null) {
      const response = failEmbedTemplate(
        "You already have an account linked.",
      );
      return { embeds: [response] };
    }

    // Execute command.
    const response = await RCONHandler([`whitelist add ${username}`], config).catch(() => null);

    // If already whitelisted.
    if (response === null) {
      const fail = failEmbedTemplate(
        "This account is already whitelisted or the server couldnt be reached",
      );
      return { embeds: [fail] };
    }

    // Add to db.
    await state.db.whitelist.create({
      data: {
        userId: author.id,
        minecraftId: uuid,
        guildId: author.guild.id,
      },
    });

    // Give role.
    if (config.rconRoleId) author.roles.add(config.rconRoleId);

    // Set Nickname.
    author.setNickname(username).catch(() => null);

    // Respond.
    return { embeds: [embedTemplate("You've been whitelisted!")] };
  }

);
