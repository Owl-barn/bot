import { GuildMember, HexColorString, MessageEmbed } from "discord.js";
import { isDJ } from "../../lib/functions.service";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "loop",
            description: "loops the queue",
            group: CommandGroup.music,

            guildOnly: true,
            premium: true,

            throttling: {
                duration: 30,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const member = msg.member as GuildMember;

        const dj = isDJ(member);
        const subscription = msg.client.musicService.get(member.guild.id);
        const vc = member.voice.channel;

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        if (!subscription || subscription.destroyed) return { embeds: [failEmbed.setDescription("Nothing is playing right now.")] };

        if (!dj || !vc || vc?.id !== subscription.voiceConnection.joinConfig.channelId) {
            return { embeds: [failEmbed.setDescription("You cant do that.")] };
        }

        const loop = subscription.toggleLoop();

        const embed = new MessageEmbed()
            .setDescription(`Loop ${loop ? "enabled" : "disabled"}`)
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};