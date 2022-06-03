import { EmbedAuthorOptions, italic } from "@discordjs/builders";
import {
    EmbedFieldData,
    GuildMember,
    EmbedBuilder,
    Util,
    ApplicationCommandOptionType,
} from "discord.js";
import moment from "moment";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import { botIcon } from "../../lib/functions";
import progressBar from "../../lib/progressBar";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import currentSong from "../../types/current";
import RavenInteraction from "../../types/interaction";
import { QueueInfo } from "../../types/queueInfo";
import Track from "../../types/track";
import wsResponse from "../../types/wsResponse";

module.exports = class extends Command {
    constructor() {
        super({
            name: "queue",
            description: "shows queue",
            group: CommandGroup.music,

            arguments: [
                {
                    name: "bot_id",
                    description: "the id of the music bot",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],

            guildOnly: true,
            premium: true,

            throttling: {
                duration: 30,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const botId = msg.options.get("bot_id") as string | null;
        if (!msg.guild) throw "no guild in stop command??";

        const member = msg.member as GuildMember;
        const vc = member.voice.channel;
        const music = msg.client.musicService;

        const failEmbed = failEmbedTemplate();
        let embed = embedTemplate();

        if (vc == null && botId == undefined) {
            const response = failEmbed.setDescription(
                "Join a voice channel first.",
            );
            return { embeds: [response] };
        }

        const musicBot = botId
            ? music.getBotById(botId)
            : vc && music.getBot(vc.id, vc.guildId);

        if (!musicBot) {
            const response = failEmbed.setDescription(
                "No available music bots.",
            );
            return { embeds: [response] };
        }

        const bot = await msg.guild.members.fetch(musicBot.getId());
        const author: EmbedAuthorOptions = {
            name: "Queue",
            iconURL: botIcon(bot),
        };

        failEmbed.setAuthor(author);
        embed.setAuthor(author);

        const request = {
            command: "Queue",
            mid: msg.id,
            data: {
                guildId: msg.guild.id,
            },
        };

        const data = (await musicBot.send(request)) as response;

        if (data.error) {
            const response = failEmbed.setDescription(data.error);
            return { embeds: [response] };
        }

        embed = makeEmbed(embed, data.queue, data.current, data.queueInfo);

        return { embeds: [embed] };
    }
};

function makeEmbed(
    embed: EmbedBuilder,
    queue: Track[],
    current: currentSong,
    queueInfo: QueueInfo,
) {
    if (!current) {
        embed.addFields([
            { name: "Now playing:", value: "Nothing is playing right now" },
        ]);
        return embed;
    }

    const progress = progressBar(current.progress / 100, 20);

    const fieldContent = `
    [${Util.escapeMarkdown(current.title.substring(0, 40))}](${current.url})
    **${current.current}** ${progress} **${current.end}**
    ${italic(`Requested by: <@!${current.requestedBy}>`)}
    `;

    const list: EmbedFieldData[] = [];

    list.push({ name: "Now playing:", value: fieldContent });
    let x = 0;

    for (const song of queue) {
        x++;
        list.push({
            name: x.toString(),
            value: `[${song.title}](${song.url}) - ${song.duration}\n${italic(
                `Requested by: <@!${song.requestedBy}>`,
            )}`,
        });
    }

    embed.addFields(list);
    if (queueInfo.repeat) {
        embed.addFields([
            {
                name: "Loop",
                value: queueInfo.repeat == 1 ? "🔂 Track" : "🔁 Queue",
            },
        ]);
    }

    embed.setFooter({
        text: `Queue length: ${moment()
            .startOf("day")
            .milliseconds(queueInfo.length)
            .format("H:mm:ss")}`,
    });

    return embed;
}

interface response extends wsResponse {
    queue: Track[];
    current: currentSong;
    queueInfo: QueueInfo;
}
