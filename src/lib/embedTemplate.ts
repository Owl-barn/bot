import { MessageEmbed, HexColorString } from "discord.js";

export function embedTemplate(): MessageEmbed {
    return new MessageEmbed().setColor(
        process.env.EMBED_COLOR as HexColorString,
    );
}

export function failEmbedTemplate(): MessageEmbed {
    return new MessageEmbed().setColor(
        process.env.EMBED_FAIL_COLOR as HexColorString,
    );
}

export function warningEmbedTemplate(): MessageEmbed {
    return new MessageEmbed().setColor(
        process.env.EMBED_WARNING_COLOR as HexColorString,
    );
}
