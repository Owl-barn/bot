import { ApplicationCommandOptionType, GuildMember, Util } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import GuildConfig from "../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "set",
            description: "Add your birthday to the bot!",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to put on timeout",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "duration",
                    description: "for how long",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "reason",
                    description: "why?",
                    required: false,
                },
            ],

            botPermissions: ["ModerateMembers"],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const timeoutLimit = 2419200000;
        if (!msg.guildId) throw "No guild on timeoutset??";

        let reason = msg.options.getString("reason", false);
        let duration = msg.options.getString("duration", true);
        const target = msg.options.getMember("user") as GuildMember | null;

        if (!target) return { content: "No user provided" };

        const durationCheck = new RegExp(
            /((?<days>[0-9]{1,2}) ?(?:d) ?)?((?<hours>[0-9]{1,2}) ?(?:h) ?)?((?<minutes>[0-9]{1,2}) ?(?:m))?/g,
        );

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        const guildInfo = GuildConfig.getGuild(msg.guildId);
        const isStaff =
            guildInfo?.staff_role &&
            target.roles.cache.get(guildInfo.staff_role);

        if (!target.moderatable || isStaff)
            return {
                embeds: [failEmbed.setDescription("I cant time-out that user")],
            };

        duration = Util.escapeMarkdown(duration).trim();
        const match = Array.from(duration.matchAll(durationCheck));

        let { days, hours, minutes } = match[0].groups as unknown as TimeInput;

        if (!days && !hours && !minutes)
            return {
                ephemeral: true,
                embeds: [embed.setDescription("Couldnt determine duration")],
            };

        days = Number(days);
        hours = Number(hours);
        minutes = Number(minutes);

        let durationMs = 0;

        durationMs += days ? Number(days) * 24 * 60 * 60 * 1000 : 0;
        durationMs += hours ? Number(hours) * 60 * 60 * 1000 : 0;
        durationMs += minutes ? Number(minutes) * 60 * 1000 : 0;

        if (durationMs < 10 * 1000) durationMs = 60 * 1000;

        if (durationMs > timeoutLimit) durationMs = timeoutLimit;

        reason = reason
            ? Util.escapeMarkdown(reason).substring(0, 127)
            : "No reason provided.";

        const member = await target.timeout(durationMs, reason);

        if (!member.communicationDisabledUntilTimestamp) throw "??";

        const durationString =
            displayUnit(days, "day") +
            displayUnit(hours, "hour") +
            displayUnit(minutes, "minute");

        embed.setTitle("Timeout Set");
        embed.setDescription(`<@${target.id}> has been timed out.`);
        embed.addFields([
            {
                name: "Reason",
                value: reason,
            },
            {
                name: "Duration",
                value: durationString,
                inline: true,
            },
            {
                name: "Expiration",
                value: `<t:${Math.round(
                    member.communicationDisabledUntilTimestamp / 1000,
                )}:R> `,
                inline: true,
            },
        ]);

        return { embeds: [embed] };
    }
};

function displayUnit(num: number, name: string, plural = "s") {
    if (!num || num === 0) return "";
    return `${num} ${name}${num > 1 ? plural : ""} `;
}

interface TimeInput {
    days: string | number;
    hours: string | number;
    minutes: string | number;
}

// durationMs === timeoutLimit
//     ? "`Discord limited it to 28 days`"
//     : ""
