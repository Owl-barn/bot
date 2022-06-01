import {
    ApplicationCommandOptionType,
    GuildMember,
    PermissionOverwriteOptions,
} from "discord.js";
import { embedTemplate } from "../../lib/embedTemplate";
import GuildConfig from "../../lib/guildconfig.service";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "privateroom",
            description: "manage your room private",
            group: CommandGroup.general,

            guildOnly: true,

            args: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "hide",
                    description: "hide/show room",
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "transfer",
                    description: "transfer room to another user",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user to transfer room to",
                            required: true,
                        },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "kick",
                    description: "kick user from room",
                    subCommands: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user to kick from the room",
                            required: true,
                        },
                    ],
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const subCommand = msg.options.getSubcommand(true);

        switch (subCommand) {
            case "hide":
                return hideRoom(msg);
            case "transfer":
                return transferRoom(msg);
            case "kick":
                return kick(msg);
            default:
                break;
        }

        throw new Error("Unknown subcommand");
    }
};

async function transferRoom(msg: RavenInteraction): Promise<returnMessage> {
    const member = msg.options.getMember("user") as GuildMember | null;
    if (member == null) return { content: "User not found" };
    if (member.user.bot)
        return { content: "You can't transfer your private room to a bot" };
    if (member.id == msg.user.id)
        return { content: "You can't transfer your room to yourself" };

    const { room, dbRoom } = await fetchRoom(msg).catch((x) =>
        x == "noRoom" ? { room: null, dbRoom: null } : Promise.reject(x),
    );
    if (!room || !dbRoom) return { content: "You don't have a private room" };

    const waitRoom = await msg.guild?.channels.fetch(dbRoom.wait_channel_id);

    const roomOwnerPermissions: PermissionOverwriteOptions = {
        ViewChannel: true,
        Connect: true,
        MoveMembers: true,
    };
    const memberPermissions: PermissionOverwriteOptions = {
        ViewChannel: true,
        Connect: true,
        MoveMembers: false,
    };

    await room.permissionOverwrites.create(member.id, roomOwnerPermissions);
    await room.permissionOverwrites.create(msg.user.id, memberPermissions);

    if (waitRoom) {
        await waitRoom.permissionOverwrites.create(
            member.id,
            roomOwnerPermissions,
        );
        await waitRoom.permissionOverwrites.create(
            msg.user.id,
            memberPermissions,
        );
    }

    const updated = await msg.client.db.private_vc.update({
        where: {
            user_id_guild_id: {
                user_id: msg.user.id,
                guild_id: msg.guildId as string,
            },
        },
        data: { user_id: member.id },
    });

    GuildConfig.updateGuild(updated.guild_id);

    const responseEmbed = embedTemplate().setDescription(
        `Room is now owned by ${member.user}`,
    );

    return { embeds: [responseEmbed] };
}

async function hideRoom(msg: RavenInteraction): Promise<returnMessage> {
    const { room } = await fetchRoom(msg).catch((x) =>
        x == "noRoom" ? { room: null, dbRoom: null } : Promise.reject(x),
    );
    if (!room) return { content: "You don't have a private room" };

    let currentState = room
        .permissionsFor(msg.guildId as string)
        ?.has("ViewChannel");

    currentState = currentState == undefined ? true : currentState;

    await room.permissionOverwrites.edit(msg.guildId as string, {
        ViewChannel: !currentState,
        Connect: false,
        Stream: true,
        Speak: true,
    });

    const responseEmbed = embedTemplate().setDescription(
        `Room is now ${currentState ? "hidden" : "visible"}`,
    );

    return { embeds: [responseEmbed] };
}

async function kick(msg: RavenInteraction): Promise<returnMessage> {
    const member = msg.options.getMember("user") as GuildMember | null;
    if (member == null) return { content: "Member not found" };
    if (member.id == msg.user.id) return { content: "You can't kick yourself" };

    const { room } = await fetchRoom(msg).catch((x) =>
        x == "noRoom" ? { room: null, dbRoom: null } : Promise.reject(x),
    );
    if (!room) return { content: "You don't have a private room" };

    if (member.voice.channelId == room.id)
        await member.voice.disconnect().catch(() => {
            null;
        });
    await room.permissionOverwrites.delete(
        member.id,
        `Manually removed from channel by ${msg.user.id}`,
    );

    const responseEmbed = embedTemplate().setDescription(
        `${member.user} has been kicked from the room`,
    );
    return { embeds: [responseEmbed], ephemeral: true };
}

async function fetchRoom(msg: RavenInteraction) {
    const dbRoom = await msg.client.db.private_vc.findUnique({
        where: {
            user_id_guild_id: {
                user_id: msg.user.id,
                guild_id: msg.guildId as string,
            },
        },
    });
    if (!dbRoom) throw "noRoom";
    const room = await msg.guild?.channels.fetch(dbRoom.main_channel_id);
    if (!room) {
        await msg.client.db.private_vc.delete({
            where: {
                user_id_guild_id: {
                    user_id: msg.user.id,
                    guild_id: msg.guildId as string,
                },
            },
        });
        throw "noRoom";
    }

    return { room, dbRoom };
}
