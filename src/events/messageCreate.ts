import { self_role_main } from "@prisma/client";
import { Guild, HexColorString, Message, MessageActionRow, MessageActionRowComponent, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import registerCommand, { registerPerms } from "../modules/command.register";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "messageCreate";
    once = false;

    async execute(msg: Message): Promise<void> {
        if (!msg) return;
        const client = msg.client as RavenClient;

        if (msg.content === "update*" && msg.member?.id === "140762569056059392") {
            const guilds = client.guilds.cache;

            for (const guild of guilds.values()) {
                await registerCommand(client, guild);
                await registerPerms(client, guild);
            }

            msg.reply("done");
        }

        if (msg.content === "innit*" && msg.member?.id === "140762569056059392") {
            await registerCommand(client, msg.guild as Guild);
            await registerPerms(client, msg.guild as Guild);
            msg.reply("done");
        }

        if (msg.content === "premium*" && msg.member?.id === "140762569056059392") {
            await client.db.guilds.update({ where: { guild_id: msg.guildId as string }, data: { premium: true } });
            msg.reply("done");
        }

        if (msg.content === "selfroles*" && msg.member?.id === "140762569056059392") {
            const main = await client.db.self_role_main.findFirst() as self_role_main;
            const roles = await client.db.self_role_roles.findMany({ where: { main_uuid: main.uuid } });
            const guild = await client.guilds.fetch(main?.guild_id);
            const channel = await guild.channels.cache.get(main.channel_id) as TextChannel;

            if (!channel) throw "aa";
            const embed = new MessageEmbed()
                .setAuthor({ iconURL: client.user?.avatarURL() || "", name: "Raven Bot" })
                .setColor(process.env.EMBED_COLOR as HexColorString)
                .setTitle(main.title)
                .setDescription(main.message);

            const buttons: MessageActionRowComponent[] = [];

            roles.forEach((x) => {
                buttons.push(
                    new MessageButton()
                        .setCustomId(x.uuid)
                        .setLabel(x.name)
                        .setStyle("PRIMARY"),
                );
            });

            const component = new MessageActionRow()
                .addComponents(buttons);

            channel.send({ components: [component], embeds: [embed] });
        }
    }
}