import { Collection, Guild, InteractionReplyOptions, MessageAttachment, TextChannel } from "discord.js";
import registerCommand, { registerPerms } from "../../modules/command.register";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class statsCommand extends Command {
    constructor() {
        super({
            name: "guild",
            description: "guild options",
            group: CommandGroup.owner,

            guildOnly: false,

            args: [
                {
                    type: argumentType.subCommand,
                    name: "list",
                    description: "See all guilds",
                },
                {
                    type: argumentType.subCommand,
                    name: "info",
                    description: "See guild info",
                    subCommands: [
                        {
                            type: argumentType.string,
                            name: "guild_id",
                            description: "guild id",
                            required: true,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "premium",
                    description: "sets guild premium state",
                    subCommands: [
                        {
                            type: argumentType.boolean,
                            name: "state",
                            description: "premium status",
                            required: true,
                        },
                        {
                            type: argumentType.string,
                            name: "guild_id",
                            description: "guild id",
                            required: true,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "leave",
                    description: "leave guild",
                    subCommands: [
                        {
                            type: argumentType.string,
                            name: "guild_id",
                            description: "guild id",
                            required: true,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "ban",
                    description: "ban guild",
                    subCommands: [
                        {
                            type: argumentType.string,
                            name: "guild_id",
                            description: "guild id",
                            required: true,
                        },
                    ],
                },
            ],

            throttling: {
                duration: 10,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const command = msg.options.getSubcommand(true);

        switch (command) {
            case "info":
                return await guildInfo(msg);
            case "list":
                return await guildList(msg);
            case "premium":
                return await guildPremium(msg);
            case "leave":
                return await guildLeave(msg);
            case "ban":
                return await guildLeave(msg);
            default:
                break;
        }

        return { content: "hmm yes" };
    }

};

async function guildLeave(msg: RavenInteraction): Promise<InteractionReplyOptions> {
    const guildID = msg.options.getString("guild_id", true);
    const client = msg.client;
    const guild = client.guilds.cache.get(guildID);
    if (!guild) return { content: "Guild not found" };

    await guild.leave();

    return { content: `Left \`${guild.name}\`` };
}

async function guildList(msg: RavenInteraction): Promise<InteractionReplyOptions> {
    const guilds = msg.client.guilds.cache.sort((x, y) => y.memberCount - x.memberCount);
    const output = guilds.map(x => `id: ${x.id} owner: ${x.ownerId} membercount: ${x.memberCount} name: ${x.name}`).join("\n");

    const attachment = new MessageAttachment(Buffer.from(output), "info.txt");

    return { files: [attachment] };
}

async function guildPremium(msg: RavenInteraction): Promise<InteractionReplyOptions> {
    const guildID = msg.options.getString("guild_id", true);
    const premium = msg.options.getBoolean("state", true);
    const client = msg.client;

    const guild = client.guilds.cache.get(guildID);

    if (!guild) return { content: "Guild not found" };

    await client.db.guilds.update({ where: { guild_id: guild.id }, data: { premium } });

    await registerCommand(client, guild);
    await registerPerms(client, guild);

    return { content: `${guild.name}'s premium was set to \`${premium}\`` };
}

async function guildInfo(msg: RavenInteraction): Promise<InteractionReplyOptions> {
    const guildID = msg.options.getString("guild_id");
    const client = msg.client;

    let guild = msg.guild as Guild;

    if (guildID) {
        guild = client.guilds.cache.get(guildID) || guild;
    }

    const query = await client.db.guilds.findUnique({ where: { guild_id: guild.id } });

    let channels = guild.channels.cache.filter(x => ["GUILD_TEXT", "GUILD_VOICE"].includes(x.type)) as Collection<string, TextChannel>;
    channels = channels.sort((x, y) => y.rawPosition - x.rawPosition);
    const channelOutput = channels.map(x => `id: ${x.id} view: ${x.viewable} type: ${x.type} name: ${x.name}`).join("\n");

    const roles = guild.roles.cache.sort((x, y) => y.position - x.position);
    const roleOutput = roles.map(x => `id: ${x.id} name: ${x.name}`).join("\n");

    const output = `${guild.name}\n\npremium: ${query?.premium}\n\nchannels:\n${channelOutput}\n\nroles:\n${roleOutput}`;

    const attachment = new MessageAttachment(Buffer.from(output), "info.txt");

    return { files: [attachment] };
}