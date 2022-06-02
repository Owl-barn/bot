import {
    ApplicationCommandOptionType,
    InteractionReplyOptions,
} from "discord.js";
import { embedTemplate } from "../../lib/embedTemplate";
import { Command } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import currentSong from "../../types/current";
import RavenInteraction from "../../types/interaction";
import { QueueInfo } from "../../types/queueInfo";
import Track from "../../types/track";
import wsResponse from "../../types/wsResponse";

module.exports = class OwletCommand extends Command {
    constructor() {
        super({
            name: "owlet",
            description: "Owlet management",
            group: CommandGroup.owner,

            guildOnly: false,

            args: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "status",
                    description: "get the status of all the owlets",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "terminate",
                    description: "terminate all the owlets",
                    required: true,
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "owlet",
                            description: "the owlet to terminate",
                            required: false,
                        },
                    ],
                },
            ],

            throttling: {
                duration: 10,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const Subcommand = msg.options.getSubcommand(true);

        switch (Subcommand) {
            case "status":
                return status(msg);
            case "terminate":
                return terminate(msg);
            default:
                throw "unknown subcommand";
        }
    }
};

async function status(msg: RavenInteraction): Promise<InteractionReplyOptions> {
    if (!msg.guild) throw "no guild in owlet status command??";
    const embed = embedTemplate();
    const client = msg.client;

    embed.setTitle("Music Bot List");
    const bots = client.musicService.getBots();

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

async function terminate(
    msg: RavenInteraction,
): Promise<InteractionReplyOptions> {
    const owlet = msg.options.getUser("owlet");

    // If owlet is specified then terminate that owlet.
    if (owlet) {
        const bot = msg.client.musicService.getBotById(owlet.id);
        if (!bot) return { content: "no bot found" };
        bot.terminate();
        return { content: `terminated <@${owlet.id}>` };
    }

    // If no owlet is specified, terminate all owlets.

    const count = msg.client.musicService.terminate();

    return { content: `Terminated all ${count} owlets` };
}
