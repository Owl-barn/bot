import { HexColorString, InteractionReplyOptions, MessageEmbed } from "discord.js";
import moment from "moment";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class statsCommand extends Command {
    constructor() {
        super({
            name: "stats",
            description: "shows bot stats",
            group: CommandGroup.moderation,

            guildOnly: false,
            adminOnly: true,
            premium: false,

            args: [
                {
                    type: argumentType.boolean,
                    name: "global",
                    description: "display global stats",
                    required: false,
                },
            ],

            throttling: {
                duration: 10,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const client = msg.client;
        const global = msg.options.getBoolean("global");

        const users = msg.client.guilds.cache.reduce((acc, { memberCount }) => acc + memberCount, 0);


        const commandUsage = await client.db.command_log.groupBy({
            by: ["command_name"],
            _count: true,
            orderBy: { _count: { command_name: "desc" } },
            take: 5,
            where: global ? {} : { guild_id: msg.guildId as string },
        });

        const musicPlayed = await client.db.songs_played.aggregate({
            _count: { uuid: true },
            _avg: { play_duration: true, song_duration: true },
            _sum: { play_duration: true, song_duration: true },
            where: global ? {} : { guild_id: msg.guildId as string },
        });

        const birthdays = await client.db.birthdays.count({ where: global ? {} : { guild_id: msg.guildId as string } });

        const embed = new MessageEmbed()
            .setTitle(global ? "Global bot stats" : `${msg.guild?.name}'s bot stats`)
            .addFields([
                { name: "Users", value: users.toString(), inline: true },
                { name: "Servers", value: client.guilds.cache.size.toString(), inline: true },
                { name: "Channels", value: client.channels.cache.size.toString(), inline: true },
            ])
            .addField("Memory usage", `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`, true)
            .addField("Uptime", moment(Date.now() - (client.uptime as number)).fromNow().replace(" ago", ""), true)
            .addField("Commands", `${client.commands.size} loaded modules`, true)
            .addField("Birthdays", `${birthdays} registered birthdays.`)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        if (commandUsage && commandUsage.length > 0) {
            embed.addField("Command Usage", commandUsage.map((x) => `**${x.command_name}:** ${x._count}`).join("\n"));
        }

        if (musicPlayed) {
            embed.addField("Music Usage", `
                **Average:** \`${Math.round((musicPlayed._avg.play_duration || 0) / 60)}/${Math.round((musicPlayed._avg.song_duration || 0) / 60)}\` minutes
                **sum:** \`${Math.round((musicPlayed._sum.play_duration || 0) / 60)}/${Math.round((musicPlayed._sum.song_duration || 0) / 60)}\` minutes
                **amount:** \`${musicPlayed._count.uuid}\` songs played
            `);
        }

        return { embeds: [embed] };
    }
};