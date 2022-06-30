import { EmbedBuilder, HexColorString } from "discord.js";

export function embedTemplate(description: string | null = null): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(process.env.EMBED_COLOR as HexColorString)
        .setDescription(description);
}

export function failEmbedTemplate(
    description: string | null = null,
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(process.env.EMBED_FAIL_COLOR as HexColorString)
        .setDescription(description);
}

export function warningEmbedTemplate(
    description: string | null = null,
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(process.env.EMBED_WARNING_COLOR as HexColorString)
        .setDescription(description);
}

export function successEmbedTemplate(
    description: string | null = null,
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(process.env.EMBED_SUCCESS_COLOR as HexColorString)
        .setDescription(description);
}
