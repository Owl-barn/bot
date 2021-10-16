import { AudioPlayerStatus } from "@discordjs/voice";
import { GuildMember } from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "pause",
            description: "pause the bot",
            group: "music",

            guildOnly: true,
            adminOnly: false,

            throttling: {
                duration: 30,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const member = msg.member as GuildMember;

        const vc = member.voice.channel;
        if (vc === null) return { content: "Join a voicechannel first." };

        const isDJ = member?.roles.cache.some(role => role.name === "DJ");
        if (!isDJ) return { ephemeral: true, content: "you dont have the DJ role" };

        const subscription = msg.client.musicService.get(member.guild.id);
        if (!subscription) return { content: "Play a song first!" };
        const paused = subscription.player.state.status === AudioPlayerStatus.Paused;
        if (paused) subscription.player.unpause();
        else subscription.player.pause();

        return { content: `Song ${paused ? "resumed" : "paused"}` };
    }
};