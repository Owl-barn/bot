import { GuildMember, MessageEmbed, Util } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "ban",
            description: "bans an user",
            group: CommandGroup.moderation,

            guildOnly: true,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "User to ban",
                    required: true,
                },
                {
                    type: argumentType.string,
                    name: "reason",
                    description: "Reason why the user is getting banned",
                    required: true,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (msg.user.id !== process.env.OWNER_ID) return {};
        const reason = Util.escapeMarkdown(msg.options.get("reason")?.value as string).substr(0, 256);
        const target = msg.options.getMember("user") as GuildMember;

        if (!target.bannable) return { ephemeral: true, content: "I cant ban that person" };

        target.ban({ reason: reason.substring(0, 128) });
        // make embed.
        const embed = new MessageEmbed()
            .setTitle(`User has been banned`)
            .setDescription(`<@${target.id}> has been banned for: \`${Util.escapeMarkdown(reason)}\``)
            .setFooter(`${msg.user.username} <@${msg.user.id}> `, msg.user.displayAvatarURL())
            .setColor("RED")
            .setTimestamp();

        // send embed.
        return { embeds: [embed] };
    }
};