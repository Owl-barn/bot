import { CommandInteraction, ImageURLOptions, MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";

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

    async execute(msg: CommandInteraction): Promise<void> {
        try {
            const settings: ImageURLOptions = { dynamic: true, size: 4096 };
            const user = msg.options.get("user")?.user;
            const hidden = msg.options.get("hidden") === null ? false : msg.options.get("hidden")?.value as boolean;
            const avatar = user !== undefined ? user.avatarURL(settings) : msg.user.avatarURL(settings);

            const embed = new MessageEmbed()
                .setImage(`${avatar}`)
                .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
                .setTimestamp();

            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId("select")
                        .setPlaceholder("Nothing selected")
                        .addOptions([
                            {
                                label: "kippog",
                                description: "This is a description",
                                value: "first_option",
                            },
                            {
                                label: "amogus",
                                description: "This is also a description",
                                value: "second_option",
                            },
                        ]),
                );


            msg.reply({ ephemeral: hidden, embeds: [embed], components: [row] });

        } catch (e) {
            console.log(e);
        }
    }
};