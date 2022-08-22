import { PrismaClient } from "@prisma/client";
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    MessageOptions,
    User,
} from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { getAvatar } from "../../../lib/functions";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "add",
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
        const client = msg.client;
        const friendUser = msg.options.getUser("user", true);

        // Check if not self.
        if (friendUser.id === msg.user.id) {
            return {
                embeds: [
                    failEmbedTemplate("You can't add yourself as friend :("),
                ],
            };
        }

        // Check if bot.
        if (friendUser.bot) {
            return {
                embeds: [
                    failEmbedTemplate("Robots aren't capable of friendship 🤖"),
                ],
            };
        }

        const isAllowed = await checkFriendLimit(
            client.db,
            friendUser.id,
            msg.user.id,
        );

        if (isAllowed !== null) return isAllowed;

        // Check if the user is already in the list.
        const exists = await client.db.friendships.findUnique({
            where: {
                user_id_friend_id: {
                    user_id: msg.user.id,
                    friend_id: friendUser.id,
                },
            },
        });

        if (exists) {
            const response = exists.pending
                ? failEmbedTemplate(
                      "You already have a pending friend request to this user!",
                  )
                : failEmbedTemplate(
                      "You already have this user in your vc notify list!",
                  );
            return { embeds: [response] };
        }

        // Create the request message.
        const requestMessage = makeRequestMsg(msg, friendUser);

        const sentDm = await friendUser.send(requestMessage).catch(() => null);

        // Couldn't send a DM, try to send a message in the channel.
        if (sentDm === null) {
            const error = {
                embeds: [
                    failEmbedTemplate(
                        "I've no way to reach this user. Please make sure your friend is able to receive DMs from me!",
                    ),
                ],
            };
            if (!msg.channel) return error;
            const sentChannelMsg = await msg.channel
                .send({ ...requestMessage, content: `${friendUser}` })
                .catch(() => null);
            if (sentChannelMsg === null) return error;
        }

        // Create the request in the database.
        await client.db.friendships.create({
            data: {
                user_id: msg.user.id,
                friend_id: friendUser.id,
                pending: true,
            },
        });

        const response = embedTemplate(
            `Successfully sent ${friendUser} a request to be added to your vc notify list!`,
        );
        response.setTitle("Friend request sent!");
        const userAvatar = getAvatar(friendUser);
        if (userAvatar) response.setThumbnail(userAvatar);

        return { embeds: [response] };
    }
};

function makeRequestMsg(
    msg: RavenInteraction,
    friendUser: User,
): MessageOptions {
    const friendRequestEmbed = embedTemplate();
    friendRequestEmbed.setTitle("Friend Request");
    friendRequestEmbed.setDescription(
        `${msg.user.username} (${msg.user}) has sent you a friend request!\nIf you choose to accept they will be notified when you join a voice channel in a mutual server!`,
    );
    const userAvatar = getAvatar(msg.user);
    if (userAvatar) friendRequestEmbed.setThumbnail(userAvatar);

    const component = new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>;

    component.addComponents(
        new ButtonBuilder()
            .setCustomId(`friend_accept_${msg.user.id}_${friendUser.id}`)
            .setLabel("Accept")
            .setStyle(ButtonStyle.Success),
    );

    component.addComponents(
        new ButtonBuilder()
            .setCustomId(`friend_decline_${msg.user.id}_${friendUser.id}`)
            .setLabel("Decline")
            .setStyle(ButtonStyle.Danger),
    );

    return { embeds: [friendRequestEmbed], components: [component] };
}

async function checkFriendLimit(
    db: PrismaClient,
    friend_id: string,
    user_id: string,
) {
    // Fetch user's friends.
    const userFriendCount = await db.friendships.count({
        where: { user_id },
    });

    // Check if user has too many friends.
    if (userFriendCount >= 20) {
        return {
            embeds: [failEmbedTemplate("You can't have more than 10 friends!")],
        };
    }

    // fetch friend's friends.
    const friendFriendCount = await db.friendships.count({
        where: { friend_id },
    });

    // Check if friend has too many friends.
    if (friendFriendCount >= 12) {
        return {
            embeds: [failEmbedTemplate("That user has too many friends!")],
        };
    }

    return null;
}
