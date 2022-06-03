import { ApplicationCommandOptionType, GuildMember } from "discord.js";
import { embedTemplate } from "../../../lib/embedTemplate";
import fetchRoom from "../../../lib/fetch_room";
import { Command, returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "kick",
            description: "kick user from your private roomroom",

            args: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "user to kick from the room",
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
        if (member == null) return { content: "Member not found" };
        if (member.id == msg.user.id)
            return { content: "You can't kick yourself" };

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
};
