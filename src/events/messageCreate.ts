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

        if (msg.content === "update*" && msg.member?.id === process.env.OWNER_ID) {
            const guilds = client.guilds.cache;
            const start = Date.now();

            for (const guild of guilds.values()) {
                await registerCommand(client, guild);
                await registerPerms(client, guild);
            }

            msg.reply(`Updated all server perms, took \`${Date.now() - start}ms\``);
        }

        if (msg.content === "info*" && msg.member?.id === process.env.OWNER_ID) {
            msg.guild?.channels.cache.forEach((x) => console.log(`${x.id} : ${x.name}`));
        }

        if (msg.content === "fix*" && msg.member?.id === process.env.OWNER_ID) {
            if (!msg.guild) return;
            await client.db.guilds.createMany({ data: { guild_id: msg.guild.id }, skipDuplicates: true });
        }


        if (msg.content === "innit*" && msg.member?.id === process.env.OWNER_ID) {
            const start = Date.now();
            await registerCommand(client, msg.guild as Guild);
            await registerPerms(client, msg.guild as Guild);
            msg.reply(`Updated this server's perms, took \`${Date.now() - start}ms\``);
        }

        if (msg.content === "premium*" && msg.member?.id === process.env.OWNER_ID) {
            await client.db.guilds.update({ where: { guild_id: msg.guildId as string }, data: { premium: true } });
            msg.reply("done");
        }

        if (msg.content === "selfroles*" && msg.member?.id === process.env.OWNER_ID) {
            const main = await client.db.self_role_main.findFirst() as self_role_main;
            const roles = await client.db.self_role_roles.findMany({ where: { main_uuid: main.uuid } });
            const guild = await client.guilds.fetch(main?.guild_id);
            const channel = await guild.channels.cache.get(main.channel_id) as TextChannel;

            if (!channel) throw "aa";
            const embed = new MessageEmbed()
                .setTitle(main.title)
                .setFooter(main.uuid)
                .setDescription(main.message)
                .setColor(process.env.EMBED_COLOR as HexColorString)
                .setAuthor({ iconURL: client.user?.avatarURL() || "", name: "Raven Bot" });

            const buttons: MessageActionRowComponent[] = [];

            roles.forEach((x) => {
                embed.addField(`${x.emote} ${x.name}`, x.description);
                buttons.push(
                    new MessageButton()
                        .setCustomId(`selfrole_${x.uuid}`)
                        .setLabel(`${x.emote} ${x.name}`)
                        .setStyle("PRIMARY"),
                );
            });

            const component = new MessageActionRow()
                .addComponents(buttons);

            channel.send({ components: [component], embeds: [embed] });
        }
    }
}