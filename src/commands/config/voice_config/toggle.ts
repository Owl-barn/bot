import { OverwriteResolvable, ChannelType } from "discord.js";
import { embedTemplate } from "../../../lib/embedTemplate";
import GuildConfig from "../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "toggle",
            description: "Toggle private vcs.",

            botPermissions: ["ManageChannels", "ManageRoles"],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guildID???";

        let channelID = null;
        let categoryID = null;
        const config = await msg.client.db.guilds.findUnique({
            where: { guild_id: msg.guildId as string },
        });
        if (!config) throw "No guild??";

        if (config.vc_channel_id) {
            const channel = msg.guild?.channels.cache.get(config.vc_channel_id);
            const category = msg.guild?.channels.cache.get(
                config.vc_category_id as string,
            );

            if (channel) await channel.delete().catch((x) => console.error(x));
            if (category)
                await category.delete().catch((x) => console.error(x));

            const vcs = await msg.client.db.private_vc.findMany({
                where: { guild_id: msg.guildId as string },
            });

            for (const vc of vcs) {
                const main = msg.guild?.channels.cache.get(vc.main_channel_id);
                const wait = msg.guild?.channels.cache.get(vc.wait_channel_id);
                await main?.delete().catch((x) => console.log(x));
                await wait?.delete().catch((x) => console.log(x));
            }
        } else {
            const botPermissions: OverwriteResolvable = {
                id: msg.client.user?.id as string,
                allow: [
                    "ViewChannel",
                    "Connect",
                    "ManageChannels",
                    "MoveMembers",
                    "Stream",
                    "Speak",
                ],
            };

            const basepermissions: OverwriteResolvable = {
                id: msg.guildId,
                allow: ["Connect"],
                deny: ["Speak", "Stream"],
            };

            const category = await msg.guild?.channels.create(
                "🔒 Private Rooms",
                {
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [botPermissions, basepermissions],
                },
            );

            if (!category) throw "Couldnt make category channel.";

            const channel = await msg.guild?.channels.create(
                "Create private room",
                {
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                },
            );

            if (!channel || !category) throw "Couldnt make vc";

            channelID = channel.id;
            categoryID = category.id;
        }

        const query = await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId as string },
            data: { vc_channel_id: channelID, vc_category_id: categoryID },
        });

        GuildConfig.updateGuild(query);

        const response = channelID
            ? `Enabled private vcs <#${channelID}>`
            : "Removed private vcs";

        const embed = embedTemplate(response);

        return { embeds: [embed] };
    }
};
