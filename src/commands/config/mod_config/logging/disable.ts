import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "disable",
            description: "Disables the event logging",

            arguments: [
                {
                    name: "type",
                    description: "The type of logging",
                    type: ApplicationCommandOptionType.Number,
                    choices: [
                        { name: "Events", value: 0 },
                        { name: "Bot", value: 1 },
                        { name: "Join/Leave", value: 2 },
                    ],
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 2,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guildID???";
        const type = msg.options.getNumber("type", false);

        const guild = await msg.client.db.guilds.update({
            where: { guild_id: msg.guildId },
            data:
                type === null
                    ? {
                          log_events: null,
                          log_bot: null,
                          log_join_leave: null,
                      }
                    : {
                          log_events: type === 0 ? null : undefined,
                          log_bot: type === 1 ? null : undefined,
                          log_join_leave: type === 2 ? null : undefined,
                      },
        });

        await GuildConfig.updateGuild(guild);

        const embed = embedTemplate();
        embed.setDescription(`The bot will no longer send logs.`);

        return { embeds: [embed] };
    }
};
