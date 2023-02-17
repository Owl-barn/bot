import {
    ApplicationCommandOptionType,
    GuildMember,
    PermissionOverwriteOptions,
    VoiceChannel,
} from "discord.js";
import { embedTemplate } from "../../../lib/embedTemplate";
import fetchRoom from "../../../lib/fetch_room";
import GuildConfig from "../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "transfer",
            description: "transfer room to another user",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "user to transfer room to",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const member = msg.options.getMember("user") as GuildMember | null;
        if (member == null) return { content: "User not found" };
        if (member.user.bot)
            return { content: "You can't transfer your private room to a bot" };
        if (member.id == msg.user.id)
            return { content: "You can't transfer your room to yourself" };

        const { room, dbRoom } = await fetchRoom(msg).catch((x) =>
            x == "noRoom" ? { room: null, dbRoom: null } : Promise.reject(x),
        );
        if (!room || !dbRoom)
            return { content: "You don't have a private room" };

        const waitRoom = (await msg.guild?.channels.fetch(
            dbRoom.wait_channel_id,
        )) as VoiceChannel | null;

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
};
