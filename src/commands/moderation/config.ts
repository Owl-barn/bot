import { permissions_type } from "@prisma/client";
import { GuildMember, HexColorString, MessageEmbed, Role } from "discord.js";
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
                        {
                            type: argumentType.subCommand,
                            name: "list",
                            description: "See current permission overrides.",
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
                if (command === "set") return await permissionsAdd(msg);
                else return await permissionList(msg);
            default:
                break;
        }
        return { content: "a" };
    }
};

async function permissionList(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";
    const client = msg.client;

    const permissions = await client.db.permissions.findMany({ where: { guild_id: msg.guildId }, orderBy: { command: "asc" } });

    let result = "";

    for (const perm of permissions) {
        result += ` - ${perm.permission ? "✅" : "❎"} ${perm.command} <@${perm.type === "ROLE" ? "&" : ""}${perm.target}>\n`;
    }


    if (result.length === 0) result = "No command overrides";

    const embed = new MessageEmbed()
        .setDescription(result)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}

async function permissionsAdd(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";
    const client = msg.client;
    const allow = msg.options.getBoolean("allow", true);
    const commandName = msg.options.getString("command_name", true);
    const role = msg.options.getRole("role") as Role | undefined;
    const user = msg.options.getMember("user") as GuildMember | undefined;

    const failEmbed = new MessageEmbed().setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    if (!((!role && user) || (role && !user))) return { embeds: [failEmbed.setDescription("Please give either a user or role.")] };

    const type = role ? permissions_type.ROLE : permissions_type.USER;
    const target = role || user;
    const targetID = target?.id as string;

    const command = client.commands.get(commandName);
    if (!command || (command.group === CommandGroup.owner && msg.user.id !== process.env.OWNER_ID)) {
        return { embeds: [failEmbed.setDescription("Command not found")] };
    }

    const guild = await client.db.guilds.findUnique({ where: { guild_id: msg.guildId } });

    if (!guild?.premium && command.premium) {
        return { embeds: [failEmbed.setDescription("Please buy ravenbot premium first.")] };
    }

    const query = await client.db.permissions.upsert({
        update: { permission: allow },
        where: {
            target_command_guild_id: {
                guild_id: msg.guildId,
                target: targetID,
                command: commandName,
            },
        },
        create: {
            guild_id: msg.guildId,
            target: targetID,
            command: commandName,
            type,
            permission: allow,
        },
    });

    const interactions = await msg.guild?.commands.fetch();
    if (!interactions) return { embeds: [failEmbed.setDescription("couldnt find command?")] };
    const interaction = interactions.find((x) => x.name === query.command);
    if (!interaction) return { embeds: [failEmbed.setDescription("couldnt find command?")] };
    const permissions = [{
        id: targetID,
        type: type,
        permission: allow,
    }];

    await interaction?.permissions.add({ permissions });


    const embed = new MessageEmbed()
        .setDescription(`${target} ${allow ? "can now use" : "can no longer use"} \`${query.command}\``)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}