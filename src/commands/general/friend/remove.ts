import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "remove",
            description: "Add a user to your vc notify list!",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description:
                        "Which user would you like to remove as friend?",
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

        client.db.friendships.delete({
            where: {
                user_id_friend_id: {
                    user_id: msg.user.id,
                    friend_id: friendUser.id,
                },
            },
        });

        return {
            embeds: [
                embedTemplate(
                    `Removed ${friendUser.username} from your friend list`,
                ),
            ],
        };
    }
};
