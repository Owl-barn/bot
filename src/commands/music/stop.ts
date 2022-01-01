import { GuildMember } from "discord.js";
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

        if (!subscription || subscription.destroyed) return { ephemeral: true, content: "Nothing is playing" };

        if (dj) {
            subscription.stop();
            return { content: "Bot stopped" };
        }

        const vc = member.voice.channel;
        if (vc == null) return { ephemeral: true, content: "Join a vc first" };
        if (vc.id !== subscription.voiceConnection.joinConfig.channelId || vc.members.size !== 2) return { ephemeral: true, content: "You do not have the `DJ` role." };

        subscription.stop();

        return { content: `Bot stopped` };
    }
};