import { italic } from "@discordjs/builders";
import { EmbedFieldData, GuildMember, HexColorString, MessageEmbed, Util } from "discord.js";
import moment from "moment";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";


module.exports = class extends Command {
    constructor() {
        super({
            name: "queue",
            description: "shows queue",
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
        const scaleSize = 20;

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_COLOR as HexColorString);

        const subscription = msg.client.musicService.get(member.guild.id);
        if (!subscription) return { embeds: [failEmbed.setDescription("Nothing is playing right now.")] };

        const current = subscription.getCurrent();

        const embed = new MessageEmbed()
            .setColor(process.env.EMBED_COLOR as HexColorString);

        if (!current) {
            embed.addField("Now playing:", "Nothing is playing right now");
            return { embeds: [embed] };
        }

        let progress = "[";
        const playTime = subscription.getPlaytime();
        const playTimeText = moment().startOf("day").seconds(playTime).format("H:mm:ss");
        const playPosition = Math.ceil((playTime / current?.duration.seconds) * scaleSize) - 1;

        for (let index = 0; index < scaleSize; index++) {
            if (index < playPosition || playPosition === scaleSize - 1) progress += "=";
            else if (index === playPosition) progress += ">";
            else if (index > playPosition) progress += "-";
        }

        progress += "]";

        const fieldContent = `
        [${Util.escapeMarkdown(current.title.substring(0, 40))}](${current.url})
        **${playTimeText}** ${progress} **${current.duration.text}**
        ${italic(`Requested by: <@!${current.user.id}>`)}
        `;

        const list: EmbedFieldData[] = [];

        list.push({ name: "Now playing:", value: fieldContent });
        let x = 0;

        for (const song of subscription.getQueue()) {
            x++;
            list.push({ name: x.toString(), value: `[${Util.escapeMarkdown(song.title.substring(0, 40))}](${song.url}) - ${song.duration.text}\n${italic(`Requested by: <@!${song.user.id}>`)}` });
        }

        embed.addFields(list);

        return { embeds: [embed] };
    }
};