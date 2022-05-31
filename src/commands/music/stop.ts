import { GuildMember, HexColorString, MessageEmbed } from "discord.js";
import { embedTemplate } from "../../lib/embedTemplate";
import { isDJ } from "../../lib/functions.service";
import { argumentType } from "../../types/argument";
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

            args: [
                {
                    name: "bot_id",
                    description: "the id of the music bot",
                    type: argumentType.string,
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

        const failEmbed = new MessageEmbed().setColor(
            process.env.EMBED_FAIL_COLOR as HexColorString,
        );

        if (vc == null) {
            const response = failEmbed.setDescription(
                "Join a voice channel first.",
            );
            return { embeds: [response] };
        }

        const musicBot =
            botId && dj
                ? music.getBotById(botId)
                : music.getBot(vc.id, vc.guildId);

        const botState = musicBot?.getGuild(msg.guild.id);

        if (!musicBot || !botState || !botState.channelId)
            return { embeds: [failEmbed.setDescription("No music playing")] };

        const memberCount = vc.members.filter((x) => !x.user.bot).size;

        if (!dj && (vc.id !== botState.channelId || memberCount > 1)) {
            const response = failEmbed.setDescription(
                "You do not have the `DJ` role.",
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

        const bot = await msg.guild.members.fetch(musicBot.getId());
        const embed = embedTemplate()
            .setDescription("Music stopped")
            .setAuthor({
                name: bot.user.username,
                iconURL: bot
                    ? bot.avatarURL() ||
                      bot.user.avatarURL() ||
                      bot.user.defaultAvatarURL
                    : undefined,
            });

        return { embeds: [embed] };
    }
};
