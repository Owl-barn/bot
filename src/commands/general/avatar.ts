import { GuildMember, ImageURLOptions, MessageEmbed } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "avatar",
            description: "View avatar",
            group: "general",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "Who's avatar to get",
                    required: false,
                },
                {
                    type: argumentType.boolean,
                    name: "global",
                    description: "public avatar or server avatar?",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {

        const settings: ImageURLOptions = { dynamic: true, size: 4096 };
        const user = msg.options.get("user")?.member as GuildMember;
        const global = msg.options.getBoolean("global");

        const member = user !== undefined ? user : msg.member as GuildMember;

        let avatar;

        if (global) avatar = member.user.avatarURL(settings);
        else avatar = member.avatarURL(settings) || member.user.avatarURL(settings);

        if (!avatar) return { ephemeral: true, content: "big uh oh stinky, dm bot owner" };

        const embed = new MessageEmbed()
            .setTitle(`${member.user.username}'s avatar`)
            .setImage(`${avatar}`)
            .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
            .setTimestamp();

        return { embeds: [embed] };
    }
};