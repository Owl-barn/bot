import {
    GuildMember,
    HexColorString,
    MessageEmbed,
    User,
    Util,
} from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";
import { isDJ } from "../../lib/functions.service";
import moment from "moment";
import { CommandGroup } from "../../types/commandGroup";
import { failEmbedTemplate } from "../../lib/embedTemplate";
import Track from "../../types/track";
import { QueueInfo } from "../../types/queueInfo";

module.exports = class extends Command {
    constructor() {
        super({
            name: "play",
            description: "Plays a song",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            args: [
                {
                    type: argumentType.string,
                    name: "song",
                    description: "song name or url",
                    required: true,
                },
                {
                    type: argumentType.boolean,
                    name: "force",
                    description: "force play?",
                    required: false,
                },
                {
                    name: "bot_id",
                    description: "the id of the music bot",
                    type: argumentType.string,
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

        const response = await musicBot.play(msg, vc.id, query, force);

        if (response.data.error)
            return { embeds: [failEmbed.setDescription(response.data.error)] };

        const botUser =
            (await msg.guild.members.fetch(musicBot.getId())) ||
            msg.guild.me?.user ||
            msg.user;
        const embed = makeEmbed(
            response.data.track,
            response.data.queueInfo,
            botUser?.user,
        );

        return {
            embeds: [embed],
        };
    };
};

function makeEmbed(track: Track, queueInfo: QueueInfo, bot: User) {
    let channelName = Util.escapeMarkdown(track.author);
    channelName = channelName.replace(/[()[\]]/g, "");

    console.log(track);

    const embed = new MessageEmbed()
        .setThumbnail(track.thumbnail)
        .setAuthor({
            name: queueInfo.size < 1 ? `Now playing` : "Song queued",
            iconURL: bot.avatarURL() || bot.defaultAvatarURL,
        })
        .setDescription(`**[${track.title}](${track.url})**`)
        .addField("Channel", `*${channelName}*`, true)
        .addField("Song Duration", `*${track.duration}*`, true)
        .addField(
            "Queue Position",
            `*${queueInfo.size !== 0 ? queueInfo.size : "Currently playing"}*`,
            true,
        )
        .setColor(process.env.EMBED_COLOR as HexColorString);

    if (queueInfo.size !== 0) {
        const timeTillPlay = moment()
            .startOf("day")
            .milliseconds(queueInfo.length - track.durationMS)
            .format("H:mm:ss");

        embed.addField("Time untill play", `*${timeTillPlay}*`, true);
    }

    return embed;
}
