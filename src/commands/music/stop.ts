import { GuildMember } from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "stop",
            description: "stop the music and clear the queue",
            group: "music",

            guildOnly: true,
            adminOnly: false,

            throttling: {
                duration: 30,
                usages: 1,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const member = msg.member as GuildMember;

        const vc = member.voice.channel;
        if (vc === null) return { ephemeral: true, content: "Join a voicechannel first." };

        const isDJ = member?.roles.cache.some(role => role.name === "DJ");
        if (!isDJ) return { ephemeral: true, content: "you dont have the DJ role" };

        const subscription = msg.client.musicService.get(member.guild.id);
        if (!subscription) return { ephemeral: true, content: "Play a song first!" };
        subscription.stop();

        return { content: `Bot stopped` };
    }
};