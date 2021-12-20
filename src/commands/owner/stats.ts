import { InteractionReplyOptions, MessageEmbed } from "discord.js";
import moment from "moment";
import { Command } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class statsCommand extends Command {
    constructor() {
        super({
            name: "stats",
            description: "shows bot stats",
            group: "owner",

            guildOnly: false,
            adminOnly: true,
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const client = msg.client;

        const users = msg.client.guilds.cache.reduce((acc, { memberCount }) => acc + memberCount, 0);

        const commandUsage = await client.db.command_log.groupBy({ by: ["command_name"], _count: true, orderBy: { _count: { command_name: "desc" } }, take: 10 });
        const musicPlayed = await client.db.songs_played.aggregate({ _avg: { play_duration: true, song_duration: true }, _sum: { play_duration: true, song_duration: true } });

        const embed = new MessageEmbed()
            .addFields([
                { name: "Users", value: users.toString(), inline: true },
                { name: "Servers", value: client.guilds.cache.size.toString(), inline: true },
                { name: "Channels", value: client.channels.cache.size.toString(), inline: true },
            ])
            .addField("Memory usage", `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`, true)
            .addField("Uptime", moment(Date.now() - (client.uptime as number)).fromNow().replace(" ago", ""), true)
            .addField("Commands", `${client.commands.size} loaded modules`, true)
            .setFooter(`${msg.user.username} <${msg.user.id}>`, msg.user.avatarURL() as string | undefined)
            .setColor("#FF0000")
            .setTimestamp();

        if (commandUsage && commandUsage.length > 0) {
            embed.addField("Command Usage", commandUsage.map((x) => `**${x.command_name}:** ${x._count}`).join("\n"));
        }

        if (musicPlayed) {
            embed.addField("Music Usage", `**Average:** ${Math.round(musicPlayed._avg.play_duration || 0)}/${Math.round(musicPlayed._avg.song_duration || 0)}\n**sum:** ${musicPlayed._sum.play_duration || 0}/${musicPlayed._sum.song_duration || 0}`);
        }

        return { embeds: [embed] };
    }
};