import { permissions_type } from "@prisma/client";
import { Role, GuildMember, MessageEmbed, HexColorString } from "discord.js";
import { returnMessage } from "../../../../types/Command";
import { CommandGroup } from "../../../../types/commandGroup";
import RavenInteraction from "../../../../types/interaction";

export default async function configPermissionsAdd(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";
    const client = msg.client;
    const allow = msg.options.getBoolean("allow", true);
    const commandName = msg.options.getString("command_name", true);
    const role = msg.options.getRole("role") as Role | undefined;
    const user = msg.options.getMember("user") as GuildMember | undefined;

    const failEmbed = new MessageEmbed().setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    if (!((!role && user) || (role && !user))) return { embeds: [failEmbed.setDescription("Please give either a user or role.")] };

    const type = role ? permissions_type.ROLE : permissions_type.USER;
    const target = role || user;
    const targetID = target?.id as string;

    const command = client.commands.get(commandName);
    if (!command || (command.group === CommandGroup.owner && msg.user.id !== process.env.OWNER_ID)) {
        return { embeds: [failEmbed.setDescription("Command not found")] };
    }

    const guild = await client.db.guilds.findUnique({ where: { guild_id: msg.guildId } });

    if (!guild?.premium && command.premium) {
        return { embeds: [failEmbed.setDescription("Please buy ravenbot premium first.")] };
    }

    const query = await client.db.permissions.upsert({
        update: { permission: allow },
        where: {
            target_command_guild_id: {
                guild_id: msg.guildId,
                target: targetID,
                command: commandName,
            },
        },
        create: {
            guild_id: msg.guildId,
            target: targetID,
            command: commandName,
            type,
            permission: allow,
        },
    });

    const interactions = await msg.guild?.commands.fetch();
    if (!interactions) return { embeds: [failEmbed.setDescription("couldnt find command?")] };
    const interaction = interactions.find((x) => x.name === query.command);
    if (!interaction) return { embeds: [failEmbed.setDescription("couldnt find command?")] };
    const permissions = [{
        id: targetID,
        type: type,
        permission: allow,
    }];

    await interaction?.permissions.add({ permissions });


    const embed = new MessageEmbed()
        .setDescription(`${target} ${allow ? "can now use" : "can no longer use"} \`${query.command}\``)
        .setColor(process.env.EMBED_COLOR as HexColorString);

    return { embeds: [embed] };
}