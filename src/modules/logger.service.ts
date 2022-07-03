import { EmbedBuilder } from "@discordjs/builders";
import { Prisma } from "@prisma/client";
import bot from "../bot";
import prisma from "../lib/db.service";
import { embedTemplate } from "../lib/embedTemplate";
import { getAvatar } from "../lib/functions";
import GuildConfig from "../lib/guildconfig.service";
import RavenInteraction from "../types/interaction";
import env from "./env";

class logServiceClass {
    private timeout: Map<string, NodeJS.Timeout>;
    private logCache: Map<string, EmbedBuilder[]>;

    constructor() {
        this.timeout = new Map();
        this.logCache = new Map();
    }

    private writeToChannel = async (guild: string) => {
        const timeout = this.timeout.get(guild);
        if (timeout) clearTimeout(timeout);
        this.timeout.delete(guild);

        // get the log embeds and remove them from the cache
        const embeds = this.logCache.get(guild);
        if (!embeds) return;
        this.logCache.delete(guild);

        // get the channel
        const config = GuildConfig.getGuild(guild);
        if (!config) return;
        if (!config.log_channel) return;

        const client = bot.getClient();
        const channel = await client.channels.fetch(config.log_channel);

        if (!channel || !(channel.isText() && channel?.guildId)) return;

        // send the embeds
        await channel.send({ embeds: embeds }).catch(console.error);
    };

    private pushlog = (content: EmbedBuilder, guild: string) => {
        // Add the embed to the cache.
        const embeds = this.logCache.get(guild) || [];
        this.logCache.set(guild, [...embeds, content]);

        // If the cache is too big, write it to the channel.
        if (embeds.length > 10) {
            this.writeToChannel(guild);
        } else if (!this.timeout.get(guild)) {
            this.timeout.set(
                guild,
                setTimeout(() => this.writeToChannel(guild), 10000),
            );
        }
    };

    public logEvent = (embed: EmbedBuilder, guild_id: string): void => {
        embed.setTimestamp();
        this.pushlog(embed, guild_id);
    };

    public logCommand = (
        interaction: RavenInteraction,
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

        const logList = [
            interaction.guild?.name,
            interaction.user.username,
            commandName,
            hidden,
        ];

        prisma.command_log
            .create({ data: query })
            .then(() => console.info(logList.join(" | ")))
            .catch(console.error);

        if (!interaction.guildId) return;
        const embed = embedTemplate();
        embed.setTitle("Command Usage");
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
        this.pushlog(embed, interaction.guildId);
    };
}

declare const global: NodeJS.Global & { logService: logServiceClass };
const logService: logServiceClass = global.logService || new logServiceClass();
if (env.isDevelopment) global.logService = logService;

export default logService;
