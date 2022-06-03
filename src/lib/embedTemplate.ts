import { EmbedBuilder, HexColorString } from "discord.js";

export function embedTemplate(): EmbedBuilder {
    return new EmbedBuilder().setColor(
        process.env.EMBED_COLOR as HexColorString,
    );
}

export function failEmbedTemplate(): EmbedBuilder {
    return new EmbedBuilder().setColor(
        process.env.EMBED_FAIL_COLOR as HexColorString,
    );
}

export function warningEmbedTemplate(): EmbedBuilder {
    return new EmbedBuilder().setColor(
        process.env.EMBED_WARNING_COLOR as HexColorString,
    );
}
