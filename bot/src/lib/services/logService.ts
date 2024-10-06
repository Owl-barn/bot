import { EmbedBuilder } from "@discordjs/builders";
import { embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { Prisma } from "@prisma/client";
import { state } from "@app";
import { ChannelType, ChatInputCommandInteraction } from "discord.js";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";

export enum logType {
  JOIN_LEAVE,
  EVENT,
  BOT,
}

export class LogService {
  private timeout: Map<string, NodeJS.Timeout>;
  private logCache: Map<string, EmbedBuilder[]>;

  constructor() {
    this.timeout = new Map();
    this.logCache = new Map();
  }

  private writeToChannel = async (guild: string, type: logType) => {
    const timeout = this.timeout.get(`${guild}_${type}`);
    if (timeout) clearTimeout(timeout);
    this.timeout.delete(`${guild}_${type}`);

    // get the log embeds and remove them from the cache
    const embeds = this.logCache.get(`${guild}_${type}`);
    if (!embeds) return;
    this.logCache.delete(`${guild}_${type}`);

    await this.sendMessage(guild, embeds, type)
      .catch((error) => {
        state.log.error(`Error sending log message`, { error });
      });
  };

  private sendMessage = async (
    guild: string,
    embeds: EmbedBuilder[],
    type: logType,
  ) => {
    // get the channel
    const config = state.guilds.get(guild);
    if (!config) return;
    if (!config.logBot && type === logType.BOT) return;
    if (!config.logEvents && type === logType.EVENT) return;
    if (!config.logJoinLeave && type === logType.JOIN_LEAVE) return;
    let channelId;

    if (type === logType.BOT) channelId = config.logBot as string;
    else if (type === logType.JOIN_LEAVE)
      channelId = config.logJoinLeave as string;
    else if (type === logType.EVENT)
      channelId = config.logEvents as string;
    else return;

    const channel = await state.client.channels.fetch(channelId);

    const isGuildVoice = channel && channel.type == ChannelType.GuildText;

    if (!isGuildVoice) return;

    // send the embeds
    await channel.send({ embeds: embeds });
  };

  private addToQueue = (content: EmbedBuilder, guild: string, type: logType) => {
    // Add the embed to the cache.
    const embeds = this.logCache.get(`${guild}_${type}`) || [];
    this.logCache.set(`${guild}_${type}`, [...embeds, content]);

    // If the cache is too big, write it to the channel.
    if (embeds.length > 10) {
      this.writeToChannel(guild, type);
    } else if (!this.timeout.get(`${guild}_${type}`)) {
      this.timeout.set(
        `${guild}_${type}`,
        setTimeout(() => this.writeToChannel(guild, type), 10000),
      );
    }
  };

  public push = (
    embed: EmbedBuilder,
    guildId: string,
    type: logType,
  ): void => {
    embed.setTimestamp();
    this.addToQueue(embed, guildId, type);
  };

  public logCommand = (
    interaction: ChatInputCommandInteraction,
    processingDuration: number,
    isHidden: boolean,
  ): void => {
    let { commandName } = interaction;

    const subCommandGroup = interaction.options.getSubcommandGroup(false);
    const subCommand = interaction.options.getSubcommand(false);

    subCommandGroup ? (commandName += `_${subCommandGroup}`) : null;
    subCommand ? (commandName += `_${subCommand}`) : null;

    const query: Prisma.CommandLogCreateInput = {
      commandName: commandName,
      isHidden,

      channelId: interaction.channelId ?? undefined,
      user: connectOrCreate(interaction.user.id),
      guild: interaction.guildId ? connectOrCreate(interaction.guildId) : undefined,
    };

    const guildName = interaction.guild ? interaction.guild.name : "DM";
    const duration = Date.now() - interaction.createdTimestamp;

    const logList = [
      guildName,
      `${processingDuration}ms`.yellow.bold +
      " - " +
      `${duration}ms`.yellow,
      interaction.user.username,
      commandName.green,
      isHidden ? "True".green : "False".red,
    ];

    state.db.commandLog
      .create({ data: query })
      .then(() => state.log.info("Command: " + logList.join(" | ")))
      .catch(state.log.error);

    if (!interaction.guild) return;
    const embed = embedTemplate();
    embed.setTitle("Command Usage");

    interaction.channel && embed.setDescription(`<#${interaction.channel.id}>`);

    embed.addFields([
      {
        name: "Hidden",
        value: isHidden ? "👻" : "🦉",
        inline: true,
      },
      {
        name: "Command",
        value: commandName,
        inline: true,
      },
    ]);

    embed.setFooter({
      text: `${interaction.user.tag} <@${interaction.user.id}>`,
      iconURL: getAvatar(interaction.member || interaction.user),
    });

    embed.setTimestamp();

    this.addToQueue(embed, interaction.guild.id, logType.BOT);
  };
}
