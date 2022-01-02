import { AudioPlayerStatus } from "@discordjs/voice";
import { GuildMember, HexColorString, MessageEmbed } from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "pause",
            description: "pause the bot",
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

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        const vc = member.voice.channel;
        if (vc === null) return { embeds: [failEmbed.setDescription("Join a voicechannel first.")] };

        const isDJ = member?.roles.cache.some(role => role.name === "DJ");
        if (!isDJ) return { embeds: [failEmbed.setDescription("you dont have the DJ role")] };

        const subscription = msg.client.musicService.get(member.guild.id);
        if (!subscription) return { embeds: [failEmbed.setDescription("Play a song first!")] };

        const paused = subscription.player.state.status === AudioPlayerStatus.Paused;

        paused ? subscription.player.unpause() : subscription.player.pause();

        const embed = new MessageEmbed()
            .setDescription(`Song ${paused ? "resumed ▶️" : "paused ⏸️"}`)
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};