import {
    GuildMember,
    HexColorString,
    EmbedBuilder,
    Util,
    ApplicationCommandOptionType,
    EmbedAuthorOptions,
} from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import { botIcon, isDJ } from "../../lib/functions";
import moment from "moment";
import { CommandGroup } from "../../types/commandGroup";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import Track from "../../types/track";
import { QueueInfo } from "../../types/queueInfo";
import wsResponse from "../../types/wsResponse";

module.exports = class extends Command {
    constructor() {
        super({
            name: "play",
            description: "Plays a song",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "song",
                    description: "song name or url",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "force",
                    description: "force play?",
                    required: false,
                },
                {
                    name: "bot_id",
                    description: "the id of the music bot",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    execute = async (msg: RavenInteraction): Promise<returnMessage> => {
        const query = msg.options.getString("song", true);
        const botId = msg.options.getString("bot_id");
        const hidden = msg.options.getBoolean("hidden") ?? false;
        let force = msg.options.getBoolean("force") ?? false;
        if (!msg.guild) throw "no guild in stop command??";

        const member = msg.member as GuildMember;
        const dj = isDJ(member);
        const vc = member.voice.channel;
        const music = msg.client.musicService;

        const failEmbed = failEmbedTemplate();
        let embed = embedTemplate();

        if (vc == null) {
            const response = failEmbed.setDescription(
                "Join a voice channel first.",
            );
            return { embeds: [response] };
        }

        if (!dj && force) force = false;

        await msg.deferReply({ ephemeral: hidden });

        const musicBot =
            botId && dj
                ? music.getBotById(botId)
                : music.getBot(vc.id, vc.guildId);

        if (!musicBot) {
            const response = failEmbed.setDescription(
                "No available music bots.",
            );
            return { embeds: [response] };
        }

        const bot = await msg.guild.members.fetch(musicBot.getId());
        const author: EmbedAuthorOptions = {
            name: "Play",
            iconURL: botIcon(bot),
        };

        failEmbed.setAuthor(author);

        const request = {
            command: "Play",
            mid: msg.id,
            data: {
                guildId: msg.guild.id,
                channelId: vc.id,
                userId: msg.user.id,
                query,
                force,
            },
        };

        const response = (await musicBot.send(request)) as response;

        if (response.error)
            return { embeds: [failEmbed.setDescription(response.error)] };

        embed = makeEmbed(embed, response.track, response.queueInfo);
        embed.setAuthor(author);

        return {
            embeds: [embed],
        };
    };
};

function makeEmbed(embed: EmbedBuilder, track: Track, queueInfo: QueueInfo) {
    let channelName = Util.escapeMarkdown(track.author);
    channelName = channelName.replace(/[()[\]]/g, "");

    embed
        .setThumbnail(track.thumbnail)
        .setTitle(queueInfo.size < 1 ? `Now playing` : "Song queued")
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields([
            { name: "Channel", value: `*${channelName}*`, inline: true },
            { name: "Duration", value: `${track.duration}`, inline: true },
            {
                name: "Queue Position",
                value: `*${
                    queueInfo.size !== 0 ? queueInfo.size : "Currently playing"
                }*`,
                inline: true,
            },
        ])
        .setColor(process.env.EMBED_COLOR as HexColorString);

    if (queueInfo.size !== 0) {
        const timeTillPlay = moment()
            .startOf("day")
            .milliseconds(queueInfo.length - track.durationMs)
            .format("H:mm:ss");

        embed.addFields([
            {
                name: "Time untill play",
                value: `*${timeTillPlay}*`,
                inline: true,
            },
        ]);
    }

    return embed;
}

interface response extends wsResponse {
    track: Track;
    queueInfo: QueueInfo;
}
