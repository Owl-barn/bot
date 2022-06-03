import {
    GuildMember,
    ApplicationCommandOptionType,
    EmbedAuthorOptions,
} from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import { botIcon, isDJ } from "../../lib/functions";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import wsResponse from "../../types/wsResponse";

module.exports = class extends Command {
    constructor() {
        super({
            name: "repeat",
            description: "loops the queue",
            group: CommandGroup.music,

            arguments: [
                {
                    name: "repeat_mode",
                    description: "the loop mode",
                    type: ApplicationCommandOptionType.Number,
                    choices: [
                        { name: "off", value: 0 },
                        { name: "track", value: 1 },
                        { name: "queue", value: 2 },
                    ],
                    required: true,
                },
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
        const repeat = msg.options.getNumber("repeat_mode", true);
        const botId = msg.options.getString("bot_id");
        if (!msg.guild) throw "no guild in stop command??";

        const member = msg.member as GuildMember;
        const dj = isDJ(member);
        const vc = member.voice.channel;
        const music = msg.client.musicService;

        const failEmbed = failEmbedTemplate();
        const embed = embedTemplate();

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
            name: "Repeat",
            iconURL: botIcon(bot),
        };

        failEmbed.setAuthor(author);
        embed.setAuthor(author);

        if (
            !dj ||
            !vc ||
            vc?.id !== musicBot.getGuild(msg.guild.id)?.channelId
        ) {
            return {
                embeds: [
                    failEmbed.setDescription(
                        "You need the `DJ` role to do that!",
                    ),
                ],
            };
        }

        const request = {
            command: "Loop",
            mid: msg.id,
            data: {
                guildId: msg.guild.id,
                repeat,
            },
        };

        const response = (await musicBot.send(request)) as response;

        let repeatMode = "";

        switch (response.repeat) {
            case 0:
                repeatMode = "❎ Off";
                break;
            case 1:
                repeatMode = "🔂 Track";
                break;
            case 2:
                repeatMode = "🔁 Queue";
                break;
        }

        embed.setDescription(`now set to: ${repeatMode}`);

        return { embeds: [embed] };
    }
};

interface response extends wsResponse {
    loop: boolean;
}
