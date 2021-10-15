import { ImageURLOptions, MessageEmbed } from "discord.js";
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
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {

        const settings: ImageURLOptions = { dynamic: true, size: 4096 };
        const user = msg.options.get("user")?.user;
        const avatar = user !== undefined ? user.avatarURL(settings) : msg.user.avatarURL(settings);

        const embed = new MessageEmbed()
            .setImage(`${avatar}`)
            .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
            .setTimestamp();

        return { embeds: [embed] };
    }
};