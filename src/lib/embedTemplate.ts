import { EmbedBuilder } from "discord.js";
import env from "../modules/env";

export function embedTemplate(description: string | null = null): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(env.EMBED_COLOR)
    .setDescription(description);
}

export function failEmbedTemplate(
  description: string | null = null,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(env.EMBED_FAIL_COLOR)
    .setDescription(description);
}

export function warningEmbedTemplate(
  description: string | null = null,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(env.EMBED_WARNING_COLOR)
    .setDescription(description);
}

export function successEmbedTemplate(
  description: string | null = null,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(env.EMBED_SUCCESS_COLOR)
    .setDescription(description);
}
