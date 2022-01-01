import { permissions_type } from "@prisma/client";
import { GuildMember, Role } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";
import { configBirthdayReset } from "./config/birthday/reset.module";
import { configBirthdaySet } from "./config/birthday/set.module";

module.exports = class extends Command {
    constructor() {
        super({
            name: "config",
            description: "birthday",
            group: CommandGroup.moderation,

            guildOnly: true,
            adminOnly: true,
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
                            name: "add",
                            description: "Add user/role to command.",
                            subCommands: [
                                {
                                    type: argumentType.string,
                                    name: "command_name",
                                    description: "What command to edit.",
                                    required: true,
                                },
                                {
                                    type: argumentType.boolean,
                                    name: "allow",
                                    description: "block or allow this role?",
                                    required: true,
                                },
                                {
                                    type: argumentType.role,
                                    name: "role",
                                    description: "What role to add.",
                                    required: false,
                                },
                                {
                                    type: argumentType.user,
                                    name: "user",
                                    description: "What user to add.",
                                    required: false,
                                },
                            ],
                        },
                    ],
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const group = msg.options.getSubcommandGroup(true);
        const command = msg.options.getSubcommand(true);

        switch (group) {
            case "birthday":
                if (command === "set") return await configBirthdaySet(msg);
                else return await configBirthdayReset(msg);
            case "permissions":
                return await permissionsAdd(msg);
            default:
                break;
        }
        return { content: "a" };
    }
};

async function permissionsAdd(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";
    const client = msg.client;
    const allow = msg.options.getBoolean("allow", true);
    const commandName = msg.options.getString("command_name", true);
    const role = msg.options.getRole("role") as Role | undefined;
    const user = msg.options.getMember("user") as GuildMember | undefined;

    if (!((!role && user) || (role && !user))) return { content: "Please give either a user or role" };

    const type = role ? permissions_type.ROLE : permissions_type.USER;
    const target = role || user;
    const targetID = target?.id as string;

    const command = client.commands.get(commandName);
    if (!command || (command.group === CommandGroup.owner && msg.user.id !== process.env.OWNER_ID)) {
        return { content: "Command not found" };
    }

    const ruleExists = await client.db.permissions.findFirst({
        where: {
            guild_id: msg.guildId,
            target: targetID,
            command: commandName,
            type,
        },
    });

    if (ruleExists) {
        await client.db.permissions.upsert({
            create: {
                guild_id: msg.guildId,
                target: targetID,
                command: commandName,
                type,
                permission: allow,
            },
            update: {
                permission: allow,
            },
            where: {
                uuid: ruleExists?.uuid,
            },
        });
    } else {
        await client.db.permissions.create({
            data: {
                guild_id: msg.guildId,
                target: targetID,
                command: commandName,
                type,
                permission: allow,
            },
        });
    }

    const interactions = await msg.guild?.commands.fetch();
    if (!interactions) return { content: "couldnt find command?" };
    const interaction = interactions.find((x) => x.name === commandName);
    if (!interaction) return { content: "couldnt find command?" };
    const permissions = [{
        id: targetID,
        type: type,
        permission: allow,
    }];

    await interaction?.permissions.add({ permissions });

    return { content: "updated!" };
}