import { embedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import currentSong from "../../../types/current";
import RavenInteraction from "../../../types/interaction";
import { QueueInfo } from "../../../types/queueInfo";
import Track from "../../../types/track";
import wsResponse from "../../../types/wsResponse";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "status",
            description: "get the status of all the owlets",

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guild) throw "no guild in owlet status command??";
        const embed = embedTemplate();
        const client = msg.client;

        embed.setTitle("Music Bot List");
        const bots = client.musicService.getOwlets();

        for (const bot of bots.values()) {
            const botList = [];
            const botUser = await msg.client.users.fetch(bot.getId());

            for (const guild of bot.getGuilds().values()) {
                if (!guild.channelId) continue;
                const request = {
                    command: "Queue",
                    mid: msg.id,
                    data: { guildId: msg.guild.id },
                };

                interface Response extends wsResponse {
                    queue: Track[];
                    current: currentSong;
                    queueInfo: QueueInfo;
                }

                const data = (await bot
                    .send(request)
                    .catch((e) => console.log(e))) as Response;
                if (!data || data.error) continue;

                const queueLength = new Date(data.queueInfo.length)
                    .toISOString()
                    .slice(11, 19);

                const discordGuild = await client.guilds.fetch(guild.id);
                const output = [
                    data.queueInfo.paused ? "❌" : "✅",
                    queueLength,
                    data.queue.length,
                    discordGuild.name,
                ];

                botList.push(output.join(" - "));
            }
            embed.addFields([
                {
                    name: botUser.username,
                    value:
                        botList.length == 0
                            ? "Nothing playing"
                            : botList.join("\n"),
                },
            ]);
        }

        if (embed.data.fields?.length == 0) {
            return { content: "No owlets found" };
        }

        return { embeds: [embed] };
    }
};
