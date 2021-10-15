import { EmbedFieldData, GuildMember, MessageEmbed } from "discord.js";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "queue",
            description: "shows queue",
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

        const subscription = msg.client.musicService.get(member.guild.id);
        if (!subscription) return { content: "Nothing is playing" };
        if (subscription.queue.length < 1) return { content: "No songs queued" };

        const list: EmbedFieldData[] = [];
        let x = 0;

        for (const song of subscription.queue) {
            x++;
            list.push({ name: x.toString(), value: `[${song.title}](${song.url})` });
        }

        const embed = new MessageEmbed()
            .addFields(list)
            .setColor(5362138)
            .setTimestamp()
            .setFooter(`${member.user.tag} - <@!${member.id}>`);

        return { embeds: [embed] };
    }
};