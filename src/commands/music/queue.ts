import { italic } from "@discordjs/builders";
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
        if (vc === null) return { ephemeral: true, content: "Join a voicechannel first." };

        const subscription = msg.client.musicService.get(member.guild.id);
        if (!subscription) return { ephemeral: true, content: "Nothing is playing" };

        const current = subscription.getCurrent();

        const list: EmbedFieldData[] = [];
        list.push({ name: "Now playing:", value: `[${current.title.substring(0, 40)}](${current.url}) - ${current.duration}\n${italic(`Requested by: ${current.user.tag}`)}` });
        let x = 0;

        for (const song of subscription.getQueue()) {
            x++;
            list.push({ name: x.toString(), value: `[${song.title.substring(0, 40)}}](${song.url}) - ${song.duration}\n${italic(`Requested by: ${song.user.tag}`)}` });
        }

        const embed = new MessageEmbed()
            .addFields(list)
            .setColor(5362138)
            .setTimestamp()
            .setFooter(`${member.user.tag} - <@!${member.id}>`);

        return { embeds: [embed] };
    }
};