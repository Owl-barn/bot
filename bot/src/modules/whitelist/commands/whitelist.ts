import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import { RconClient, RCONError } from "../lib/rcon.service";
import { getConfig } from "../lib/getConfig";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { localState, MAX_MINECRAFT_NAME_LENGTH } from "..";
import { MinecraftUser } from "../lib/minecraft_api.service";

export default Command(

  // Info
  {
    name: "whitelist",
    description: "Whitelist yourself to the connected minecraft server.",
    group: CommandGroup.general,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "mc_name",
        description: "What mc account to whitelist",
        max: MAX_MINECRAFT_NAME_LENGTH,
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
    const suppliedMinecraftName = msg.options
      .getString("mc_name", true)
      .trim()
      .substring(0, MAX_MINECRAFT_NAME_LENGTH);

    await msg.deferReply();
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
    const minecraftUser = await MinecraftUser.fromUsername(suppliedMinecraftName);

    // Check if exists.
    if (!minecraftUser)
      return {
        embeds: [failEmbedTemplate("mc account doesn't exist")],
      };

    // Check if already registered.
    const userExists = await state.db.whitelist.findFirst({
      where: {
        OR: [{ userId: author.id }, { minecraftId: minecraftUser.id }],
      },
    });

    // Check if already in db.
    if (userExists !== null) {
      const currentMinecraftUser = await MinecraftUser.fromId(userExists.minecraftId);
      const response = failEmbedTemplate(
        `You already have an account linked with the name \`${currentMinecraftUser?.name ?? "---------"}\`.`,
      );
      return { embeds: [response] };
    }

    // Execute command.
    try {
      await RconClient.addUserToWhitelist(config, minecraftUser.name);
    } catch (error) {
      if (error !== RCONError.RedundantAction) {
        let message = "An error occurred while whitelisting.";

        // Check for specific RCON errors.
        switch (error) {
          case RCONError.ServerUnreachable:
            message = "The server is currently unreachable, please try again later.";
            break;
          case RCONError.UnknownServerError:
            message = "An unknown error occurred on the minecraft server.";
            break;
          case RCONError.RedundantAction:
            message = "You are already whitelisted.";
            break;
          default: {
            localState.log.error(
              `Error while whitelisting user ${author.id} (${author.user.tag}) with username ${minecraftUser.name}`,
              { error },
            );
          }
        }

        const fail = failEmbedTemplate(message);
        return { embeds: [fail] };
      } else {
        localState.log.info(`User ${author.id} (${author.user.tag}) was already whitelisted with username ${minecraftUser.name}, saved to database regardless.`);
      }
    }

    // Add to db.
    await state.db.whitelist.create({
      data: {
        user: connectOrCreate(author.id),
        guild: connectOrCreate(author.guild.id),
        minecraftId: minecraftUser.id,
      },
    });

    // Give role.
    if (config.roleId) await author.roles.add(config.roleId);

    // Set Nickname.
    await author.setNickname(minecraftUser.name).catch(() => null);

    // Respond.
    return { embeds: [embedTemplate(`You've successfully been whitelisted with the account \`${minecraftUser.name}\`!`)] };
  }

);
