import { MessageEmbed, GuildMember } from "discord.js";
import RavenButton from "../types/button";
import { returnMessage } from "../types/Command";
import { RavenButtonInteraction } from "../types/interaction";

export default class implements RavenButton {
    disabled: boolean;
    name = "selfrole";

    async execute(msg: RavenButtonInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guild";

        const error = { ephemeral: true, content: "An error occured" };
        const client = msg.client;
        const user = msg.member as GuildMember | undefined;

        const buttonID = msg.customId.split("_")[1];

        if (!user) return error;

        const query = await client.db.self_role_roles.findFirst({ where: { uuid: buttonID } });

        if (!query) return error;

        const hasRole = user.roles.cache.get(query.role_id);
        const embed = new MessageEmbed();

        if (hasRole) {
            user.roles.remove(query.role_id);
            embed.setColor("RED");
            embed.setDescription(`Role \`${query.name}\` removed!`);
            return { ephemeral: true, embeds: [embed] };
        } else {
            user.roles.add(query.role_id);
            embed.setColor("GREEN");
            embed.setDescription(`Role \`${query.name}\` added!`);
            return { ephemeral: true, embeds: [embed] };
        }
    }

}