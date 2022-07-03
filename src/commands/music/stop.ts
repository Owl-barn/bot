import {
    GuildMember,
    ApplicationCommandOptionType,
    EmbedAuthorOptions,
} from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import { getAvatar, isDJ } from "../../lib/functions";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import wsResponse from "../../types/wsResponse";

module.exports = class extends Command {
    constructor() {
        super({
            name: "stop",
            description: "stop the music and clear the queue",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            arguments: [
                {
                    name: "bot_id",
                    description: "the id of the music bot",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 1,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const botId = msg.options.getString("bot_id");
        if (!msg.guild) throw "no guild in stop command??";

        const member = msg.member as GuildMember;
        const music = msg.client.musicService;
        const dj = isDJ(member);
        const vc = member.voice.channel;

        const failEmbed = failEmbedTemplate();
        const embed = embedTemplate();

        if (vc == null) {
            const response = failEmbed.setDescription(
                "Join a voice channel first.",
            );
            return { embeds: [response] };
        }

        const musicBot =
            botId && dj
                ? music.getOwletById(botId)
                : music.getOwlet(vc.id, vc.guildId);

        const botState = musicBot?.getGuild(msg.guild.id);

        if (!musicBot || !botState || !botState.channelId)
            return { embeds: [failEmbed.setDescription("No music playing")] };

        const bot = await msg.guild.members.fetch(musicBot.getId());
        const author: EmbedAuthorOptions = {
            name: "Stop",
            iconURL: getAvatar(bot),
        };

        failEmbed.setAuthor(author);
        embed.setAuthor(author);

        const memberCount = vc.members.filter((x) => !x.user.bot).size;

        if (!dj && (vc.id !== botState.channelId || memberCount > 1)) {
            const response = failEmbed.setDescription(
                "You need the `DJ` role to do that!",
            );
            return { embeds: [response] };
        }

        const request = {
            command: "Stop",
            mid: msg.id,
            data: {
                guildId: msg.guild.id,
            },
        };

        const response = (await musicBot.send(request)) as wsResponse;

        if (response.error)
            return { embeds: [failEmbed.setDescription(response.error)] };

        embed.setDescription("Music stopped");

        return { embeds: [embed] };
    }
};
