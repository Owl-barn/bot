import { MessageEmbed, HexColorString } from "discord.js";

export const embed = new MessageEmbed()
    .setColor(process.env.EMBED_COLOR as HexColorString);

export const failEmbed = new MessageEmbed()
    .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);