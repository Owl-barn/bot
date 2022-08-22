import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "list",
            description: "Add a user to your vc notify list!",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description:
                        "Which user do you want to add to your vc notify list?",
                    required: true,
                },
            ],

            throttling: {
                duration: 600,
                usages: 5,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const db = msg.client.db;
        const friends = await db.friendships.findMany({
            where: {
                OR: [{ user_id: msg.user.id }, { friend_id: msg.user.id }],
            },
        });

        const pendingSent = friends.filter(
            (friend) => friend.user_id === msg.user.id && friend.pending,
        );

        const pendingReceived = friends.filter(
            (friend) => friend.friend_id === msg.user.id && friend.pending,
        );

        const friendSelf = friends.filter(
            (friend) => friend.user_id === msg.user.id && !friend.pending,
        );

        const friendOther = friends.filter(
            (friend) => friend.friend_id === msg.user.id && !friend.pending,
        );

        const embed = embedTemplate();
        embed.setTitle("Friend List");

        // Check if the user has no friends.
        if (
            pendingSent.length == 0 &&
            pendingReceived.length == 0 &&
            friendSelf.length == 0 &&
            friendOther.length == 0
        ) {
            embed.setDescription("You currently have no friends :(");
            return { embeds: [embed] };
        }

        embed.setDescription(
            "Here you can see who gets notified when you join a voice channel and the the people you get notified of!",
        );

        if (friendSelf.length > 0) {
            embed.addFields({
                name: "My alerts",
                value: friendSelf
                    .map((friend) => `<@${friend.friend_id}>`)
                    .join("\n"),
                inline: true,
            });
        }

        if (friendOther.length > 0) {
            embed.addFields({
                name: "My friend alerts",
                value: friendOther
                    .map((friend) => `<@${friend.user_id}>`)
                    .join("\n"),
                inline: true,
            });
        }

        if (pendingSent.length > 0) {
            embed.addFields({
                name: "Sent pending requests",
                value: pendingSent
                    .map((friend) => `<@${friend.friend_id}>`)
                    .join("\n"),
                inline: true,
            });
        }

        if (pendingReceived.length > 0) {
            embed.addFields({
                name: "Received pending requests",
                value: pendingReceived
                    .map((friend) => `<@${friend.user_id}>`)
                    .join("\n"),
                inline: true,
            });
        }

        return {
            embeds: [embed],
        };
    }
};
