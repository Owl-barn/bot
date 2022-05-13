import { self_role_main } from "@prisma/client";
import { Guild, HexColorString, Message, MessageActionRow, MessageActionRowComponent, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import AFKService from "../lib/afk.service";
import prisma from "../lib/db.service";
import { yearsAgo } from "../lib/functions.service";
import GuildConfig from "../lib/guildconfig.service";
import levelService from "../lib/level.service";
import registerCommand from "../modules/command.register";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "messageCreate";
    once = false;

    async execute(msg: Message): Promise<void> {
        if (!msg) return;
        if (msg.author.bot) return;
        if (msg.guildId && GuildConfig.getGuild(msg.guildId)?.banned) return;

        levelService.message(msg).catch((x) => console.error(x));
        AFKService.onMessage(msg).catch((x) => console.error(x));
        const client = msg.client as RavenClient;

        if (msg.content === "-cookie" && msg.guildId === "396330910162616321") {
            msg.reply("$suppressErrors").catch((x) => console.log(x));
            return;
        }

        if (msg.content === "perms*" && msg.member?.id === process.env.OWNER_ID) {
            console.log(msg.guild?.me?.permissions.toArray());
            return;
        }

        if (msg.content === "update*" && msg.member?.id === process.env.OWNER_ID) {
            const guilds = client.guilds.cache;
            const start = Date.now();
            await msg.reply("updating...");

            for (const guild of guilds.values()) {
                guild.commands.set([]);
                await registerCommand(client, guild);
            }

            await msg.reply(`Updated all server perms, took \`${Date.now() - start}ms\``);
            return;
        }

        if (msg.content === "fix*" && msg.member?.id === process.env.OWNER_ID) {
            if (!msg.guild) return;
            await client.db.guilds.createMany({ data: { guild_id: msg.guild.id }, skipDuplicates: true });
        }

        if (msg.content === "innit*" && msg.member?.id === process.env.OWNER_ID) {
            const start = Date.now();
            await registerCommand(client, msg.guild as Guild);
            msg.reply(`Updated this server's perms, took \`${Date.now() - start}ms\``);
        }

        if (msg.content.startsWith("say*") && msg.member?.id === process.env.OWNER_ID) {
            const channel = client.guilds.cache.get("396330910162616321")?.channels.cache.get("504696026201063444") as TextChannel;
            await channel.send(msg.content.substring(5, msg.content.length));
        }

        if (msg.content.startsWith("age*") && msg.member?.id === process.env.OWNER_ID) {
            let birthdays = await prisma.birthdays.findMany({ where: { guild_id: msg.guildId as string } });
            let combined = 0;
            const currentYear = new Date().getFullYear();
            birthdays = birthdays.filter(x => x.birthday && x.birthday.getFullYear() > currentYear - 40);
            birthdays = birthdays.sort((x, y) => Number(y.birthday) - Number(x.birthday));
            birthdays.forEach(x => combined += yearsAgo(x.birthday as Date));
            const average = Math.round(combined / birthdays.length);
            msg.reply(`Average: ${average}\nMedian: ${yearsAgo(birthdays[Math.round(birthdays.length / 2)].birthday as Date)}\nRange: ${yearsAgo(birthdays[0].birthday as Date)} - ${yearsAgo(birthdays[birthdays.length - 1].birthday as Date)}`);
            return;
        }

        if (msg.content === "levels*" && (msg.member?.id === process.env.OWNER_ID || msg.member?.id === "174689636310974464")) {
            const staff = msg.guild?.roles.cache.get("399435813580046356")?.members.map(x => x.id);
            if (!staff) return;
            const staffLevels = await client.db.level.findMany({ where: { user_id: { in: staff }, guild_id: "396330910162616321" }, orderBy: { experience: "desc" } });

            let response = "levels: \n";

            for (const x of staffLevels) {
                const member = await msg.guild?.members.fetch(x.user_id);
                if (!member) continue;
                const level = levelService.calculateLevel(x.experience);
                response += `${member?.user.username} - ${level.level} - ${((level.currentXP / level.levelXP) * 100).toFixed(2)}%\n`;
            }

            await msg.reply(response);
        }

        if (msg.content === "selfroles*" && msg.member?.id === process.env.OWNER_ID) {
            const main = await client.db.self_role_main.findFirst({ where: { guild_id: msg.guildId as string } }) as self_role_main;
            const roles = await client.db.self_role_roles.findMany({ where: { main_uuid: main.uuid } });
            const guild = await client.guilds.fetch(main?.guild_id);
            const channel = guild.channels.cache.get(main.channel_id) as TextChannel;

            if (!channel) throw "aa";
            const embed = new MessageEmbed()
                .setTitle(main.title)
                .setFooter({ text: main.uuid })
                .setDescription(main.message)
                .setColor(process.env.EMBED_COLOR as HexColorString);

            const buttons: MessageActionRowComponent[] = [];

            roles.forEach((x) => {
                embed.addField(`${x.emote} ${x.name} `, x.description);
                buttons.push(
                    new MessageButton()
                        .setCustomId(`selfrole_${x.uuid} `)
                        .setLabel(`${x.emote} ${x.name} `)
                        .setStyle("PRIMARY"),
                );
            });

            const component = new MessageActionRow()
                .addComponents(buttons);

            channel.send({ components: [component], embeds: [embed] });
        }
    }
}