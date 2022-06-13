import {
    ApplicationCommandOptionType,
    EmbedAuthorOptions,
    GuildMember,
} from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import { botIcon, isDJ } from "../../lib/functions";
import Owlet from "../../modules/owlet";
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
            name: "skip",
            description: "skips a song",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "index",
                    description: "which song to skip",
                    min: 0,
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "force",
                    description: "force skip?",
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
                usages: 2,
            },
        });
    }

    public execute = async (msg: RavenInteraction): Promise<returnMessage> => {
        const botId = msg.options.getString("bot_id");
        const force = msg.options.getBoolean("force") ?? false;
        const index = msg.options.getInteger("index") ?? 0;
        if (!msg.guild) throw "no guild in stop command??";

        const member = msg.member as GuildMember;
        const vc = member.voice.channel;
        const dj = isDJ(member);
        const music = msg.client.musicService;

        const failEmbed = failEmbedTemplate();
        const embed = embedTemplate();

        if (vc == null && botId == undefined) {
            const response = failEmbed.setDescription(
                "Join a voice channel first.",
            );
            return { embeds: [response] };
        }

        await msg.deferReply();

        // Get bot.
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
            name: "Skip",
            iconURL: botIcon(bot),
        };

        embed.setAuthor(author);
        failEmbed.setAuthor(author);

        const djBool = dj && force;
        let aloneBool = false;

        // Calculate if the user is alone in the voice channel
        if (vc) {
            const memberCount = vc.members.filter((x) => !x.user.bot).size;
            aloneBool = vc.id == musicBot.getGuild(msg.guild.id)?.channelId;
            aloneBool = aloneBool && memberCount == 1;
        }

        // If the bot is alone with the user or if a dj is forcing the skip.
        if (djBool || aloneBool) {
            const response = await skip(msg, musicBot, index, force);

            if (response.error) {
                failEmbed.setDescription(response.error);
                return { embeds: [failEmbed] };
            }

            embed.setDescription(`Skipped song`);
            return { embeds: [embed] };
        }

        // Get queue data from the bot.
        const queueRequest = {
            command: "Queue",
            mid: msg.id + "_queue",
            data: {
                guildId: msg.guild.id,
            },
        };

        const queueResponse = (await musicBot.send(queueRequest)) as response;
        if (queueResponse.error) {
            const fail = failEmbed.setDescription(queueResponse.error);
            return { embeds: [fail] };
        }

        const queue = queueResponse.queue;
        const current = queueResponse.current;

        // Index is specified.
        if (index !== 0) {
            // User provided an index that is out of bounds.
            if (queue.length == 0 || index > queue.length) {
                const fail = failEmbed.setDescription(
                    "I couldn't find a song at that position, Try a lower number?",
                );
                return { embeds: [fail] };
            }

            // User provided a valid index but doesnt own the song.
            const selected = queue[index - 1];

            if (selected && selected.requestedBy === msg.user.id) {
                // User provided a valid index and owns the song.
                const response = await skip(msg, musicBot, index, force);
                if (response.error) {
                    failEmbed.setDescription(response.error);
                    return { embeds: [failEmbed] };
                }
                return {
                    embeds: [
                        embed.setDescription(
                            `Successfully skipped \`${
                                (response.track as Track).title
                            }\``,
                        ),
                    ],
                };
            }

            // User tried skipping current song and they added the song.
        } else if (current.requestedBy == msg.user.id) {
            const response = await skip(msg, musicBot, index, force);
            if (response.error) {
                failEmbed.setDescription(response.error);
                return { embeds: [failEmbed] };
            }
            return {
                embeds: [
                    embed.setDescription(
                        `Successfully skipped \`${
                            (response.track as Track).title
                        }\``,
                    ),
                ],
            };
        }

        failEmbed.setDescription(
            `You can't skip that song because you didn't request it.`,
        );

        return { embeds: [failEmbed] };
    };
};

async function skip(
    msg: RavenInteraction,
    musicBot: Owlet,
    index: number,
    force: boolean,
) {
    if (!msg.guild) throw "no guild in skip command??";
    const request = {
        command: "Skip",
        mid: msg.id,
        data: {
            force,
            guildId: msg.guild.id,
            index,
        },
    };

    return (await musicBot.send(request)) as wsResponse;
}

interface response extends wsResponse {
    queue: Track[];
    current: currentSong;
    queueInfo: QueueInfo;
    loop: boolean;
}
