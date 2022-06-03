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
            name: "pause",
            description: "pause the bot",
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
            name: "Pause",
            iconURL: botIcon(bot),
        };

        failEmbed.setAuthor(author);
        embed.setAuthor(author);

        if (vc) {
            const memberCount = vc.members.filter((x) => !x.user.bot).size;

            if (
                !dj &&
                (vc.id !== musicBot.getGuild(msg.guild.id)?.channelId ||
                    memberCount > 1)
            ) {
                const response = failEmbed.setDescription(
                    "You do not have the `DJ` role.",
                );
                return { embeds: [response] };
            }
        }

        const request = {
            command: "Pause",
            mid: msg.id,
            data: {
                guildId: msg.guild.id,
            },
        };

        const response = (await musicBot.send(request)) as response;

        if (response.error)
            return { embeds: [failEmbed.setDescription(response.error)] };

        embed.setDescription(`Music ${response.paused ? "paused" : "resumed"}`);

        return { embeds: [embed] };
    }
};

interface response extends wsResponse {
    paused: boolean;
}
