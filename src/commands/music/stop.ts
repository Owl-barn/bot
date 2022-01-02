import { GuildMember, HexColorString, MessageEmbed } from "discord.js";
import { isDJ } from "../../lib/functions.service";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "stop",
            description: "stop the music and clear the queue",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            throttling: {
                duration: 30,
                usages: 1,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const member = msg.member as GuildMember;

        const dj = isDJ(member);
        const subscription = msg.client.musicService.get(member.guild.id);

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        if (!subscription || subscription.destroyed) return { embeds: [failEmbed.setDescription("Nothing is playing right now.")] };

        if (!dj) {
            const vc = member.voice.channel;
            if (vc == null) return { embeds: [failEmbed.setDescription("Join a voice channel first.")] };
            if (vc.id !== subscription.voiceConnection.joinConfig.channelId || vc.members.size !== 2) {
                return { embeds: [failEmbed.setDescription("You do not have the `DJ` role.")] };
            }
        }

        subscription.stop();

        const embed = new MessageEmbed()
            .setDescription("Bot stopped")
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};