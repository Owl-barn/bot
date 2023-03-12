import { EmbedBuilder } from "@discordjs/builders";
import { embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { Prisma } from "@prisma/client";
import { state } from "@app";
import { ChannelType, ChatInputCommandInteraction } from "discord.js";

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

    await this.sendMessage(guild, embeds, type);
  };

  private sendMessage = async (
    guild: string,
    embeds: EmbedBuilder[],
    type: logType,
  ) => {
    // get the channel
    const config = state.guilds.get(guild);
    if (!config) return;
    if (!config.log_bot && type === logType.BOT) return;
    if (!config.log_events && type === logType.EVENT) return;
    if (!config.log_join_leave && type === logType.JOIN_LEAVE) return;
    let channelId;

    if (type === logType.BOT) channelId = config.log_bot as string;
    else if (type === logType.JOIN_LEAVE)
      channelId = config.log_join_leave as string;
    else if (type === logType.EVENT)
      channelId = config.log_events as string;
    else return;

    const channel = await state.client.channels.fetch(channelId);

    const isGuildVoice = channel && channel.type == ChannelType.GuildText;

    if (!isGuildVoice) return;

    // send the embeds
    await channel.send({ embeds: embeds }).catch(console.error);
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
    guild_id: string,
    type: logType,
  ): void => {
    embed.setTimestamp();
    this.addToQueue(embed, guild_id, type);
  };

  public logCommand = (
    interaction: ChatInputCommandInteraction,
    processingDuration: number,
    hidden: boolean,
  ): void => {
    let { commandName } = interaction;

    const subCommandGroup = interaction.options.getSubcommandGroup(false);
    const subCommand = interaction.options.getSubcommand(false);

    subCommandGroup ? (commandName += `_${subCommandGroup}`) : null;
    subCommand ? (commandName += `_${subCommand}`) : null;

    const query: Prisma.command_logUncheckedCreateInput = {
      user: interaction.user.id,
      command_name: commandName,
      guild_id: interaction.guildId,
      channel_id: interaction.channelId,
      hidden,
    };

    const guildName = interaction.guild ? interaction.guild.name : "DM";
    const duration = Date.now() - interaction.createdTimestamp;

    const logList = [
      guildName,
      `${processingDuration}ms`.yellow.bold +
      " - " +
      `${duration}ms`.yellow,
      interaction.user.username,
      commandName,
      hidden ? "True".green : "False".red,
    ];

    state.db.command_log
      .create({ data: query })
      .then(() => console.info(logList.join(" | ")))
      .catch(console.error);

    if (!interaction.guildId) return;
    const embed = embedTemplate();
    embed.setTitle("Command Usage");
    interaction.channel &&
      embed.setDescription(`<#${interaction.channel.id}>`);
    embed.addFields([
      {
        name: "Hidden",
        value: hidden ? "👻" : "🦉",
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
    this.addToQueue(embed, interaction.guildId, logType.BOT);
  };
}
