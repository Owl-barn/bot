import { MessageEmbed, Role } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "config",
            description: "birthday",
            group: CommandGroup.moderation,

            guildOnly: true,
            adminOnly: false,
            premium: false,

            args: [
                {
                    type: argumentType.subCommandGroup,
                    name: "birthday",
                    description: "Settings for birthday system",
                    subCommands: [
                        {
                            type: argumentType.subCommand,
                            name: "set",
                            description: "Set the birthday role",
                            subCommands: [
                                {
                                    type: argumentType.role,
                                    name: "birthday_role",
                                    description: "What role to set as birthday role.",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "reset",
                            description: "Reset the birthday role and turn off the auto role.",
                        },
                    ],
                },
                {
                    type: argumentType.subCommandGroup,
                    name: "permissions",
                    description: "Settings for command permissions",
                    subCommands: [
                        {
                            type: argumentType.subCommand,
                            name: "set",
                            description: "Add user/role to command.",
                            subCommands: [
                                {
                                    type: argumentType.string,
                                    name: "command_name",
                                    description: "What command to edit.",
                                    required: true,
                                },
                                {
                                    type: argumentType.role,
                                    name: "birthday_role",
                                    description: "What role to add.",
                                    required: false,
                                },
                            ],
                        },
                        {
                            type: argumentType.subCommand,
                            name: "remove",
                            description: "Remove command permission of user/command.",
                            required: false,
                            subCommands: [
                                {
                                    type: argumentType.role,
                                    name: "birthday_role",
                                    description: "What role to set as birthday role.",
                                    required: true,
                                },
                            ],
                        },
                    ],
                },
            ],

            throttling: {
                duration: 720,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const group = msg.options.getSubcommandGroup(true);
        const command = msg.options.getSubcommand(true);

        switch (group) {
            case "birthday":
                return (await birthday(msg, command));
            default:
                break;
        }
        return { content: "a" };
    }
};


const birthday = async (msg: RavenInteraction, command: string): Promise<returnMessage> => {
    const birthdayRole = msg.options.getRole("birthday_role", true) as Role;
    if (command === "set") {
        if (!birthdayRole.editable) return { content: "I cant assign this role" };

        await msg.client.db.guilds.update({ where: { guild_id: msg.guildId }, data: { birthday_id: birthdayRole.id } });

        const embed = new MessageEmbed()
            .addField("Success", `Successfully set ${birthdayRole} as the birthday auto role!`)
            .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
            .setColor("RED")
            .setTimestamp();

        return { embeds: [embed] };
    } else {
        await msg.client.db.guilds.update({ where: { guild_id: msg.guildId }, data: { birthday_id: null } });

        const embed = new MessageEmbed()
            .addField("Success", `Successfully reset and disabled the birthday auto role!`)
            .setFooter(`${msg.user.username} <@${msg.user.id}>`, msg.user.displayAvatarURL())
            .setColor("RED")
            .setTimestamp();

        return { embeds: [embed] };
    }

    throw "a";
};