import { GuildMember, MessageEmbed, HexColorString } from "discord.js";
import { returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

export default async function birthdayDifference(msg: RavenInteraction): Promise<returnMessage> {
    const client = msg.client;
    if (!msg.guildId) throw "No guildID???";

    const first_user = msg.options.getMember("first_user", true) as GuildMember;
    let second_user = msg.options.getMember("second_user") as GuildMember | undefined;
    const embed = new MessageEmbed();
    embed.setColor(process.env.EMBED_COLOR as HexColorString);

    if (!second_user) second_user = msg.member as GuildMember;

    const users = await client.db.birthdays.findMany({
        where: {
            OR: [
                { user_id: first_user.id },
                { user_id: second_user.id },
            ],
            guild_id: msg.guildId,
        },
        orderBy: { birthday: "asc" },
    });

    if (users.length !== 2) return { embeds: [embed.setDescription("one or more of you dont have a birthday registered")] };

    const difference = Math.abs((Number(users[0].birthday) - Number(users[1].birthday)) / (1000 * 60 * 60 * 24));
    const years = Math.floor(difference / 365);
    const days = difference % 365;

    const differenceString = `${years ? `${years} year${years == 1 ? "" : "s"} and` : ""} ${days} day${days == 1 ? "" : "s"}`;
    const oldest = users[0].user_id === second_user.id ? second_user : first_user;
    const youngest = users[1].user_id === second_user.id ? second_user : first_user;

    embed.addField(`Who is older?`, `${oldest} is older than ${youngest} by ${differenceString} ${years > 2 ? `(sussy)` : ""}`);

    return { embeds: [embed] };
}