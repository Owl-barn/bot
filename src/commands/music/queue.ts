import { italic } from "@discordjs/builders";
import {
    EmbedFieldData,
    GuildMember,
    HexColorString,
    MessageEmbed,
    Util,
} from "discord.js";
import moment from "moment";
import { failEmbedTemplate } from "../../lib/embedTemplate";
import progressBar from "../../lib/progressBar";
import { argumentType } from "../../types/argument";
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

            args: [
                {
                    name: "bot_id",
                    description: "the id of the music bot",
                    type: argumentType.string,
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
        const botId = msg.options.getString("bot_id");
        if (!msg.guild) throw "no guild in stop command??";

        const member = msg.member as GuildMember;
        const vc = member.voice.channel;
        const music = msg.client.musicService;

        const failEmbed = failEmbedTemplate();

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

        const bot = await msg.guild.members.fetch(musicBot.getId());

        const embed = makeEmbed(
            data.queue,
            data.current,
            data.queueInfo,
            data.loop,
            bot,
        );

        return { embeds: [embed] };
    }
};

function makeEmbed(
    queue: Track[],
    current: currentSong,
    queueInfo: QueueInfo,
    loop: boolean,
    bot: GuildMember,
) {
    const embed = new MessageEmbed().setColor(
        process.env.EMBED_COLOR as HexColorString,
    );
    embed.setAuthor({
        iconURL: bot
            ? bot.avatarURL() ||
              bot.user.avatarURL() ||
              bot.user.defaultAvatarURL
            : undefined,
        name: "Queue",
    });

    if (!current) {
        embed.addField("Now playing:", "Nothing is playing right now");
        return embed;
    }

    const progress = progressBar(current.progress, 20);

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
    if (loop) {
        embed.addField("Loop", "🔁 *enabled*");
    }

    console.log(JSON.stringify(queue));

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
    loop: boolean;
}
