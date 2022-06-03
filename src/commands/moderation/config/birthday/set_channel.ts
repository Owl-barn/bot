import {
    GuildBasedChannel,
    EmbedBuilder,
    HexColorString,
    ClientUser,
    ApplicationCommandOptionType,
} from "discord.js";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "set_channel",
            description: "Set the channel for the birthday announcements",

            arguments: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: "birthday_channel",
                    description: "Where to send happy birthday messages.",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "no guild??";

        const channel = msg.options.getChannel("birthday_channel") as
            | GuildBasedChannel
            | undefined;

        const failEmbed = new EmbedBuilder()
            .setDescription(`I cant assign this role.`)
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        if (channel && !channel.permissionsFor(msg.client.user as ClientUser))
            return { embeds: [failEmbed] };

        await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId },
            data: { birthday_channel: channel?.id || null },
        });

        const embed = new EmbedBuilder()
            .setDescription(
                channel
                    ? `Successfully set ${channel} as the birthday message channel!`
                    : "Birthday channel removed.",
            )
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
};
